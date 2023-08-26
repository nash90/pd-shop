import { getWeekOfTheYear, removeOldWeeklyKeys } from "../../pg-core/utils/helpers"
import { ShopCurrencyType, ShopItemType } from "./type"

export const SOLD_OUT_IMAGE_LINK = "https://i.ibb.co/CKVptFL/sorry-sold-out.png"
export const SHOP_STATS_DB_KEY = "shop-stats-v1"
export const WEEKLY_USD_SALES_PREFIX = "weeklyUsdSales"

export const getShoppingCurrency = (itemType: ShopItemType) => {
  switch(itemType) {
    case ShopItemType.GIFT_POINTS_TO_USD_PACK:
      return ShopCurrencyType.GIFT_POINTS
    case ShopItemType.USD_TO_GIFT_POINTS_PACK:
      return ShopCurrencyType.USD
    default:
      return ShopCurrencyType.GIFT_POINTS
  }
}

export const updateWeeklyTotal = (
  object: any,
  amount: number,
  weeklyPrefix: string
) => {
  const today = new Date();
  const weeklySalesLabel = weeklyPrefix + getWeekOfTheYear(today);
  object[weeklySalesLabel] = (object[weeklySalesLabel] || 0) + amount;

  object = removeOldWeeklyKeys(object, weeklyPrefix);

  return object;
};

