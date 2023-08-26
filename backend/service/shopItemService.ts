import { buyAnyWithGiftpoints, buyExpPackWithGiftpoints, buyGiftPointsWithUsd, buyUsdWithGiftpoints, buyWhitelistWithGiftpoints, getAllActiveShopItems, getShopItem } from "../db/shopItemCollection"
import { SHOP_ITEM_NOT_AVAILABLE, SHOP_ITEM_NOT_FOUND, SHOP_ITEM_TYPE_NOT_FOUND } from "../../../pg-core/error/errorMessages";
import { ShopItemType } from "../type";

const getAllActiveItems = () => {

  return getAllActiveShopItems()
}

const buyShopItem = async (userId: string, itemId: string) => {
  const item = await getShopItem(itemId)
  if(!item) {
    throw Error(`${SHOP_ITEM_NOT_FOUND} ${itemId} ${userId}`);
  }

  if(item.disable) {
    throw Error(`${SHOP_ITEM_NOT_AVAILABLE} ${itemId} ${userId}`);
  }

  switch(item.itemType) {
    case ShopItemType.GIFT_POINTS_TO_USD_PACK:
      return buyUsdWithGiftpoints(userId, itemId)
    case ShopItemType.USD_TO_GIFT_POINTS_PACK:
      return buyGiftPointsWithUsd(userId, itemId)
    case ShopItemType.WHITELIST_FOR_NFT_MINT:
      return buyWhitelistWithGiftpoints(userId, itemId)
    case ShopItemType.BUY_WITH_GIFT_POINTS:
      return buyAnyWithGiftpoints(userId, itemId)
    case ShopItemType.GIFT_POINTS_TO_EXP_PACK:
      return buyExpPackWithGiftpoints(userId, itemId)
    default:
      throw Error(`${SHOP_ITEM_TYPE_NOT_FOUND} ${itemId} ${userId}`);
  }

}

export {
  getAllActiveItems,
  buyShopItem
}