import { NextApiRequest, NextApiResponse } from "next";
import { ResData } from "../../../pd-core/type/ResData";
import { ResShop, ShopRequest } from "../type";
import { getTokenPlayloadAndValidateUser } from "../../../pd-auth/utils/AuthHelpers";
import { buyShopItem, getAllActiveItems } from "../service/shopItemService";

export const shopBuyHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<ResData>
) => {
  
  const { data } = JSON.parse(req.body) as ShopRequest
  getTokenPlayloadAndValidateUser(req, res, data.pubKey)

  await buyShopItem(data.pubKey, data.itemId as string)
  
  return res.status(200).json({ 
    type: "BUY_SHOP_ITEMS", 
    status: "success",
  });
}

export const shopItemsHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<ResShop>
) => {
  
  const reqData = JSON.parse(req.body) as ShopRequest
  getTokenPlayloadAndValidateUser(req, res, reqData.data.pubKey)

  const shopItems = await getAllActiveItems()
  
  return res.status(200).json({ 
    type: "GET_SHOP_ITEMS", 
    status: "success",
    data: shopItems
  });
}
