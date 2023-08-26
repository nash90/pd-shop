import { ShopItemModel } from "./db/model"

export enum ShopCurrencyType {
  USD = 1,
  GIFT_POINTS = 2,
}

export enum BuyActivityType {
  Shop = 1,
  Upgrade = 2,
}

export enum ShopItemType {
  GIFT_POINTS_TO_USD_PACK = 1,
  USD_TO_GIFT_POINTS_PACK = 2,
  WHITELIST_FOR_NFT_MINT = 3,
  BUY_WITH_GIFT_POINTS = 4,
  GIFT_POINTS_TO_EXP_PACK = 5,
}

export type ResShop = {
  type: string,
  status: string,
  data: ShopItemModel[]
}

export type ShopRequest = {
  data: {
    pubKey: string,
    itemId?: string,
  }
}
