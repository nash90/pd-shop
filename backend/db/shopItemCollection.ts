import { INSUFFICIENT_GIFT_POINTS_TO_BUY, INSUFFICIENT_USD_TO_BUY, SHOP_ITEM_NOT_AVAILABLE, SHOP_ITEM_NOT_FOUND, SHOP_ITEM_SOLD_OUT, USER_NOT_FOUND_FOR_PLAYER } from "../../../pg-core/error/errorMessages"
import { db, userRef} from "../../../pg-core/backend/db/client";
import { UserModel } from "../../../pg-core/backend/db/UserModel";
import { ShopActivityModel, ShopItemModel, ShopStatsModel } from "./model";
import { shopItemRef, shopStatsRef } from "./client";
import { BuyActivityType, ShopCurrencyType } from "../type";
import { addNewShopActivity } from "./shopActivityCollection";
import { SHOP_STATS_DB_KEY, WEEKLY_USD_SALES_PREFIX, updateWeeklyTotal } from "../helper";
import { logShopActivity } from "../service/shopDiscordService";

const DB_ERROR_ON_ADD_NEW_SHOP_ITEM = "DB error on add new shopItem";
const DB_ERROR_ON_SET_SHOP_ITEM = "DB error on set shopItem";
const DB_ERROR_ON_GET_SHOP_ITEM = "DB error on get shopItem";
const DB_ERROR_ON_GET_ALL_SHOP_ITEMS = "DB error on get all shopItem"

export const addNewShopItem = async (shopItem: ShopItemModel) => {
  try {
    const docRes = await shopItemRef.add(shopItem)
    console.log("Added new shopItem record: ", docRes.id);
    return docRes.id
  } catch (e) {
    console.error("Error adding new shopItem record: ", e);
    throw Error(DB_ERROR_ON_ADD_NEW_SHOP_ITEM)
  }
}

export const getShopItem = async (id: string) => {
  try {
    const docRef = shopItemRef.doc(id);
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      return undefined 
    }
    console.log("Get shopItem record: ", docRef.id);
    return docSnap.data() as ShopItemModel    
  } catch (e) {
    console.error("Error getting shopItem record: ", e);
    throw Error(DB_ERROR_ON_GET_SHOP_ITEM)
  }
}

export const setShopItem = async (shopItem: ShopItemModel, id: string) => {
  try {
    const docRef = shopItemRef.doc(id);
    await docRef.set(shopItem)
    console.log("Set shopItem record: ", docRef.id);
  } catch (e) {
    console.error("Error setting shopItem record: ", e);
    throw Error(DB_ERROR_ON_SET_SHOP_ITEM)
  }
}

export const getAllActiveShopItems = async (): Promise<ShopItemModel[]> => {
  try {
    const querySnapshot = await shopItemRef.where('disable', '!=', true).get();
    const shopItems: ShopItemModel[] = [];

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const shopItem = doc.data() as ShopItemModel;
        shopItems.push({
          ...shopItem,
          id: doc.id
        });
      });
    }

    // if item list grows, better to do sort in db query
    const sortedShopItems = shopItems.sort((a, b) => {
      if (a.orderCode < b.orderCode) {
        // a should be before b
        return -1; 
      } else if (a.orderCode > b.orderCode) {
        // a should be after b
        return 1; 
      } else {
        // a and b are equal in itemType, maintain the original order
        return 0; 
      }
    });

    return sortedShopItems;
  } catch (e) {
    console.error("Error getting all active shop items: ", e);
    throw Error(DB_ERROR_ON_GET_ALL_SHOP_ITEMS);
  }
};

export const buyUsdWithGiftpoints = async (userId: string, shopItemId: string) => {
  const userDoc = userRef.doc(userId);
  const shopItemDoc = shopItemRef.doc(shopItemId);

  const transactionResult = await db.runTransaction(async (transaction) => {
    // Get the user document
    const userSnap = await transaction.get(userDoc);

    // Check if the user document exists
    if (!userSnap.exists) {
      throw Error(`${USER_NOT_FOUND_FOR_PLAYER} ${userId}`);
    }

    const user = userSnap.data() as UserModel;

    // Get the shopItem document
    const shopItemSnap = await transaction.get(shopItemDoc);

    // Check if the shopItem document exists
    if (!shopItemSnap.exists) {
      throw Error(`${SHOP_ITEM_NOT_FOUND} ${shopItemId}`);
    }

    const shopItem = shopItemSnap.data() as ShopItemModel;

    // Validate enabled item
    if(shopItem.disable) {
      throw Error(`${SHOP_ITEM_NOT_AVAILABLE} ${shopItemId} ${userId}`);
    }
    
    // Validate quantity of shop item
    if (shopItem.quantity < 1) {
      throw Error(SHOP_ITEM_SOLD_OUT);
    }

    // Calculate the cost of the shop item in gift points
    const giftPointCost = shopItem.gpPrice || 1000;

    // Check if the user has enough gift points to make the purchase
    const userGiftPoints = user.giftPoints || 0
    if (userGiftPoints < giftPointCost) {
      throw Error(`${INSUFFICIENT_GIFT_POINTS_TO_BUY} ${user.giftPoints}`);
    }

    // Deduct the gift point cost from the user's gift points balance
    const newGiftPointsBalance = userGiftPoints - giftPointCost;

    // Add the USD return value to the user's USD balance
    const newUsdBalance = user.usdBalance + (shopItem.usdReturn || 0);

    // Reduce the quantity of the shop item by 1
    const newQuantity = shopItem.quantity - 1;

    // Update the user document with the new balances and quantity
    transaction.update(userDoc, {
      giftPoints: newGiftPointsBalance,
      usdBalance: newUsdBalance,
    });

    // Update the shop item document with the new quantity
    transaction.update(shopItemDoc, {
      quantity: newQuantity,
    });

    const shopActivity = {
      createdDatetime: new Date(),
      updatedDatetime: new Date(),
      buyType: BuyActivityType.Shop,
      currencyType: ShopCurrencyType.GIFT_POINTS,
      amount: giftPointCost,
      userId: userId,
      itemInfo: shopItem.name,
      itemType: shopItem.itemType
    }
    addNewShopActivity(shopActivity)
    logShopActivity(shopActivity)

    return {
      success: true,
      message: 'Shop item bought successfully',
    };
  });

  return transactionResult;
};


export const buyGiftPointsWithUsd = async (userId: string, shopItemId: string) => {
  const userDoc = userRef.doc(userId);
  const shopItemDoc = shopItemRef.doc(shopItemId);
  const shopStatsDoc = shopStatsRef.doc(SHOP_STATS_DB_KEY);

  const transactionResult = await db.runTransaction(async (transaction) => {
    // Get Shop stats 
    const shopStatsSnap = await transaction.get(shopStatsDoc)

    // Get the user document
    const userSnap = await transaction.get(userDoc);

    // Check if the user document exists
    if (!userSnap.exists) {
      throw Error(`${USER_NOT_FOUND_FOR_PLAYER} ${userId}`);
    }

    const user = userSnap.data() as UserModel;

    // Get the shopItem document
    const shopItemSnap = await transaction.get(shopItemDoc);

    // Check if the shopItem document exists
    if (!shopItemSnap.exists) {
      throw Error(`${SHOP_ITEM_NOT_FOUND} ${shopItemId}`);
    }

    const shopItem = shopItemSnap.data() as ShopItemModel;

    // Validate enabled item
    if(shopItem.disable) {
      throw Error(`${SHOP_ITEM_NOT_AVAILABLE} ${shopItemId} ${userId}`);
    }

    // Validate quantity of shop item
    if (shopItem.quantity < 1) {
      throw Error(SHOP_ITEM_SOLD_OUT);
    }

    // Calculate the cost of the shop item in USD
    const usdCost = shopItem.usdPrice;

    // Check if the user has enough usd to make the purchase
    const userUsdBalance = user.usdBalance || 0
    if (userUsdBalance < usdCost) {
      throw Error(`${INSUFFICIENT_USD_TO_BUY} ${userUsdBalance} ${userId}`);
    }

    // Deduct the USD cost from the user's USD balance
    const newUsdBalance = userUsdBalance - usdCost;

    // Add the Gift point return value to the user's gift points balance
    const newGiftPointsBalance = (user.giftPoints || 0) + (shopItem.gpReturn || 0);

    // Reduce the quantity of the shop item by 1
    const newQuantity = shopItem.quantity - 1;

    // Update the user document with the new balances and quantity
    transaction.update(userDoc, {
      giftPoints: newGiftPointsBalance,
      usdBalance: newUsdBalance,
    });

    // Update the shop item document with the new quantity
    transaction.update(shopItemDoc, {
      quantity: newQuantity,
    });

    const shopActivity = {
      createdDatetime: new Date(),
      updatedDatetime: new Date(),
      buyType: BuyActivityType.Shop,
      currencyType: ShopCurrencyType.USD,
      amount: usdCost,
      userId: userId,
      itemInfo: shopItem.name,
      itemType: shopItem.itemType
    }
    addNewShopActivity(shopActivity)
    logShopActivity(shopActivity)

    if(shopStatsSnap.exists) {
      const shopStats = shopStatsSnap.data() as ShopStatsModel
      let update = {
        ...shopStats,
        totalUsdSales: (shopStats.totalUsdSales || 0) + usdCost,
        unclaimedUsdSales: (shopStats.unclaimedUsdSales || 0) + usdCost,
      }
      update = updateWeeklyTotal(update, usdCost, WEEKLY_USD_SALES_PREFIX)
      // Update Shop stats
      transaction.set(shopStatsDoc, update);
    }

    return {
      success: true,
      message: 'Shop item bought successfully',
    };
  });

  return transactionResult;
};


export const buyWhitelistWithGiftpoints = async (userId: string, shopItemId: string) => {
  const userDoc = userRef.doc(userId);
  const shopItemDoc = shopItemRef.doc(shopItemId);

  const transactionResult = await db.runTransaction(async (transaction) => {
    // Get the user document
    const userSnap = await transaction.get(userDoc);
    // Check if the user document exists
    if (!userSnap.exists) {
      throw Error(`${USER_NOT_FOUND_FOR_PLAYER} ${userId}`);
    }
    const user = userSnap.data() as UserModel;

    // Get the shopItem document
    const shopItemSnap = await transaction.get(shopItemDoc);
    // Check if the shopItem document exists
    if (!shopItemSnap.exists) {
      throw Error(`${SHOP_ITEM_NOT_FOUND} ${shopItemId}`);
    }
    const shopItem = shopItemSnap.data() as ShopItemModel;

    // Validate enabled item
    if(shopItem.disable) {
      throw Error(`${SHOP_ITEM_NOT_AVAILABLE} ${shopItemId} ${userId}`);
    }
    
    // Validate quantity of shop item
    if (shopItem.quantity < 1) {
      throw Error(SHOP_ITEM_SOLD_OUT);
    }

    const currentWhitelistBalance = user.whitelistBalance || 0
    const maxBuyLimitPerUser = shopItem.maxLimitPerUser || 3
    // Validate max limit per user for shop item
    if ( currentWhitelistBalance >= maxBuyLimitPerUser ) {
      throw Error(SHOP_ITEM_SOLD_OUT + " : max buy limit exceeded");
    }

    // Calculate the cost of the shop item in gift points
    const giftPointCost = shopItem.gpPrice;

    // Check if the user has enough gift points to make the purchase
    const userGiftPoints = user.giftPoints || 0
    if (userGiftPoints < giftPointCost) {
      throw Error(`${INSUFFICIENT_GIFT_POINTS_TO_BUY} ${user.giftPoints}`);
    }

    // Deduct the gift point cost from the user's gift points balance
    const newGiftPointsBalance = userGiftPoints - giftPointCost;

    // Add the white list to the user's white list balance
    const newWhitelistBalance = currentWhitelistBalance + 1;

    // Reduce the quantity of the shop item by 1
    const newQuantity = shopItem.quantity - 1;

    // Update the user document with the new balances and quantity
    transaction.update(userDoc, {
      giftPoints: newGiftPointsBalance,
      whitelistBalance: newWhitelistBalance,
    });

    // Update the shop item document with the new quantity
    transaction.update(shopItemDoc, {
      quantity: newQuantity,
    });

    const shopActivity = {
      createdDatetime: new Date(),
      updatedDatetime: new Date(),
      buyType: BuyActivityType.Shop,
      currencyType: ShopCurrencyType.GIFT_POINTS,
      amount: giftPointCost,
      userId: userId,
      itemInfo: shopItem.name,
      itemType: shopItem.itemType
    }
    addNewShopActivity(shopActivity)
    logShopActivity(shopActivity)

    return {
      success: true,
      message: 'Shop item bought successfully',
    };
  });

  return transactionResult;
};

export const buyAnyWithGiftpoints = async (userId: string, shopItemId: string) => {
  const userDoc = userRef.doc(userId);
  const shopItemDoc = shopItemRef.doc(shopItemId);

  const transactionResult = await db.runTransaction(async (transaction) => {
    // Get the user document
    const userSnap = await transaction.get(userDoc);
    // Check if the user document exists
    if (!userSnap.exists) {
      throw Error(`${USER_NOT_FOUND_FOR_PLAYER} ${userId}`);
    }
    const user = userSnap.data() as UserModel;

    // Get the shopItem document
    const shopItemSnap = await transaction.get(shopItemDoc);
    // Check if the shopItem document exists
    if (!shopItemSnap.exists) {
      throw Error(`${SHOP_ITEM_NOT_FOUND} ${shopItemId}`);
    }
    const shopItem = shopItemSnap.data() as ShopItemModel;

    // Validate enabled item
    if(shopItem.disable) {
      throw Error(`${SHOP_ITEM_NOT_AVAILABLE} ${shopItemId} ${userId}`);
    }
    
    // Validate quantity of shop item
    if (shopItem.quantity < 1) {
      throw Error(SHOP_ITEM_SOLD_OUT);
    }

    // Calculate the cost of the shop item in gift points
    const giftPointCost = shopItem.gpPrice;

    // Check if the user has enough gift points to make the purchase
    const userGiftPoints = user.giftPoints || 0
    if (userGiftPoints < giftPointCost) {
      throw Error(`${INSUFFICIENT_GIFT_POINTS_TO_BUY} ${userGiftPoints}`);
    }

    // Deduct the gift point cost from the user's gift points balance
    const newGiftPointsBalance = userGiftPoints - giftPointCost;

    // Reduce the quantity of the shop item by 1
    const newQuantity = shopItem.quantity - 1;

    // Update the user document with the new balances and quantity
    transaction.update(userDoc, {
      giftPoints: newGiftPointsBalance,
    });

    // Update the shop item document with the new quantity
    transaction.update(shopItemDoc, {
      quantity: newQuantity,
    });

    const shopActivity = {
      createdDatetime: new Date(),
      updatedDatetime: new Date(),
      buyType: BuyActivityType.Shop,
      currencyType: ShopCurrencyType.GIFT_POINTS,
      amount: giftPointCost,
      userId: userId,
      itemInfo: shopItem.name,
      itemType: shopItem.itemType
    } as ShopActivityModel

    addNewShopActivity(shopActivity)
    logShopActivity(shopActivity)

    return {
      success: true,
      message: 'Shop item bought successfully',
    };
  });

  return transactionResult;
};


export const buyExpPackWithGiftpoints = async (userId: string, shopItemId: string) => {
  const userDoc = userRef.doc(userId);
  const shopItemDoc = shopItemRef.doc(shopItemId);

  const transactionResult = await db.runTransaction(async (transaction) => {
    // Get the user document
    const userSnap = await transaction.get(userDoc);

    // Check if the user document exists
    if (!userSnap.exists) {
      throw Error(`${USER_NOT_FOUND_FOR_PLAYER} ${userId}`);
    }

    const user = userSnap.data() as UserModel;

    // Get the shopItem document
    const shopItemSnap = await transaction.get(shopItemDoc);

    // Check if the shopItem document exists
    if (!shopItemSnap.exists) {
      throw Error(`${SHOP_ITEM_NOT_FOUND} ${shopItemId}`);
    }

    const shopItem = shopItemSnap.data() as ShopItemModel;

    // Validate enabled item
    if(shopItem.disable) {
      throw Error(`${SHOP_ITEM_NOT_AVAILABLE} ${shopItemId} ${userId}`);
    }
    
    // Validate quantity of shop item
    if (!(shopItem.quantity > 0)) {
      throw Error(SHOP_ITEM_SOLD_OUT);
    }

    // Calculate the cost of the shop item in gift points
    const giftPointCost = shopItem.gpPrice || 1000;

    // Check if the user has enough gift points to make the purchase
    const userGiftPoints = user.giftPoints || 0
    if (userGiftPoints < giftPointCost) {
      throw Error(`${INSUFFICIENT_GIFT_POINTS_TO_BUY} ${user.giftPoints}`);
    }

    // Deduct the gift point cost from the user's gift points balance
    const newGiftPointsBalance = userGiftPoints - giftPointCost;
    const userExpPacks = user.expPacks || 0

    // Add the exp pack return value to the user's exp pack balance
    const newExpPackBalance = userExpPacks + (shopItem.expPackReturn || 0);

    // Reduce the quantity of the shop item by 1
    const newQuantity = shopItem.quantity - 1;

    // Update the user document with the new balances and quantity
    transaction.update(userDoc, {
      giftPoints: newGiftPointsBalance,
      expPacks: newExpPackBalance,
    } as Partial<UserModel>);

    // Update the shop item document with the new quantity
    transaction.update(shopItemDoc, {
      quantity: newQuantity,
    });

    const shopActivity = {
      createdDatetime: new Date(),
      updatedDatetime: new Date(),
      buyType: BuyActivityType.Shop,
      currencyType: ShopCurrencyType.GIFT_POINTS,
      amount: giftPointCost,
      userId: userId,
      itemInfo: shopItem.name,
      itemType: shopItem.itemType
    }
    addNewShopActivity(shopActivity)
    logShopActivity(shopActivity)

    return {
      success: true,
      message: 'Shop item bought successfully',
    };
  });

  return transactionResult;
};

