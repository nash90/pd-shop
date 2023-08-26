import { getDbRefByDate } from "../../../pg-core/backend/db/client";
import { shopActivityCollectionBase } from "./client";
import { ShopActivityModel } from "./model";

const DB_ERROR_ON_ADD_NEW_SHOP_ACTIVITY = "DB error on add new shopActivity";

export const addNewShopActivity = async (shopActivity: ShopActivityModel) => {
  const shopActivityRef = getDbRefByDate(shopActivityCollectionBase, new Date())
  try {
    const docRes = await shopActivityRef.add(shopActivity);
    console.log("Added new shopActivity record: ", docRes.id);
    return docRes.id;
  } catch (e) {
    console.error("Error adding new shopActivity record: ", e);
    throw Error(DB_ERROR_ON_ADD_NEW_SHOP_ACTIVITY);
  }
};
