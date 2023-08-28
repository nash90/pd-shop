import { db } from "../../../pd-core/backend/db/client"

const appEnv = process.env.NEXT_PUBLIC_APP_ENV


export const shopActivityCollectionBase = "pd-shop-activity"
let shopItemCollection = "pd-shop-items"
let shopStatsCollection = "pd-shop-stats"
// let shopActivityCollection = `${shopActivityCollectionBase}-${getYearMonth()}`;


if (appEnv != "prod") {
  shopItemCollection = "dev-pd-shop-items"
  shopStatsCollection = "dev-pd-shop-stats"
  // shopActivityCollection = `dev-${shopActivityCollection}`
}


export const shopItemRef = db.collection(shopItemCollection)
export const shopStatsRef = db.collection(shopStatsCollection)
// export const shopActivityRef = db.collection(shopActivityCollection)
