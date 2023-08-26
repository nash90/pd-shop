import { db } from "../../../pg-core/backend/db/client";
import { shopStatsRef } from "./client";
import { ShopStatsModel } from "./model";

const DB_ERROR_ON_SET_SHOP_STATS = "DB error on set shopStats";

export const setShopStats = async (shopStats: ShopStatsModel, id: string) => {
  try {
    const docRef = shopStatsRef.doc(id);
    await docRef.set(shopStats);
    console.log("Set shopStats record: ", docRef.id);
  } catch (e) {
    console.error("Error setting shopStats record: ", e);
    throw Error(DB_ERROR_ON_SET_SHOP_STATS);
  }
};

export const getOrCreateShopStats = async (id: string) => {
  try {
    const docRef = shopStatsRef.doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      console.log("shopStats data fetched:", docSnap.data());
      return docSnap.data() as ShopStatsModel;
    } else {
      const newShopStats = {
        totalUsdSales: 0,
        unclaimedUsdSales: 0,
      } as ShopStatsModel;
      await setShopStats(newShopStats, id);
      return newShopStats;
    }
  } catch (e) {
    const errMsg = "Error on getOrCreateShopStats record: ";
    console.error(errMsg, e);
    throw Error(errMsg);
  }
};

export const resetUnclaimedUsdSales = async (id: string) => {
  try {
    const docRef = shopStatsRef.doc(id);

    return db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (docSnap.exists) {
        const shopStats = docSnap.data() as ShopStatsModel;
        shopStats.unclaimedUsdSales = 0; // Reset the unclaimedUsdSales field
        transaction.update(docRef, shopStats);
      }
    });
  } catch (e) {
    const errMsg = "Error resetting unclaimed USD sales: ";
    console.error(errMsg, e);
    throw Error(errMsg);
  }
};


