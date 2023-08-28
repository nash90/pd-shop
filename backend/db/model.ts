import { CustomDate } from "../../../pd-core/backend/db/model";
import { BuyActivityType, ShopCurrencyType, ShopItemType } from "../type";

export interface ShopItemModel {
  id: string,
  name: string,
  description: string,
  gpPrice: number,
  usdPrice: number,
  itemType: ShopItemType,
  imageUrl: string,
  imageFile?: string,
  quantity: number,
  usdReturn?: number,
  gpReturn?: number,
  expPackReturn?: number,
  maxLimitPerUser?: number,
  disable: boolean,
  expireDatetime: CustomDate | undefined,
  orderCode: string,
}

export interface ShopStatsModel {
  totalUsdSales: number,
  unclaimedUsdSales: number,
  [key: string]: number
}

export interface ShopActivityModel {
  createdDatetime: CustomDate,
  updatedDatetime: CustomDate,
  buyType: BuyActivityType,
  currencyType: ShopCurrencyType,
  amount: number,
  userId: string,
  itemInfo: string,
  itemType: number,
}
