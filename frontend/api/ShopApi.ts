import { ResData } from "../../../pg-core/type/ResData"
import { handleBadResponseFromServer } from "../../../pg-core/error/errorHelpers"
import { UNKNOWN_API_RESPONSE_DATA } from "../../../pg-core/error/errorMessages"
import { ResShop, ShopRequest } from "../../backend/type"

export const getShopItemsApi = async (pubKey: string) => {

  const res = await fetch("/api/shop", {
    method: 'POST',
    body: JSON.stringify({
      data: {
        pubKey,
      }
    } as ShopRequest)
  }).then(async (res) => {
    await handleBadResponseFromServer(res)
    return res
  }).catch((err) => {
    console.log("Error getShopItemsApi ::", err)
    throw Error(err)
  })

  const resData = await res.json() as ResShop | undefined
  if (!resData) {
    throw Error(UNKNOWN_API_RESPONSE_DATA)
  }
  return resData
}

export const buyItemApi = async (pubKey: string, itemId: string) => {
  const res = await fetch("/api/shop/buy", {
    method: 'POST',
    body: JSON.stringify({
      data: {
        pubKey,
        itemId
      }
    } as ShopRequest)
  }).then(async (res) => {
    await handleBadResponseFromServer(res)
    return res
  }).catch((err) => {
    console.log("Error buyItemApi ::", err)
    throw Error(err)
  })

  const resData = await res.json() as ResData | undefined
  if (!resData) {
    throw Error(UNKNOWN_API_RESPONSE_DATA)
  }
  return resData
}
