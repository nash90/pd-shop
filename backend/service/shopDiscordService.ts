import { discordWebhookClient, getDevKeyForDiscord } from "../../../pd-core/backend/service/discordService";
import { ShopActivityModel } from "../db/model";
import { ShopCurrencyType } from "../type";

const appEnv = process.env.NEXT_PUBLIC_APP_ENV
const DISCORD_WEBHOOK_CREATE_API_SHOP = "https://discord.com/api/webhooks/1126819241774035004/BBo72-c6j9WGdBTkAt9XJnYM7QoklLBbCVFEROOioJnUuKS8yu1vfWOs4Kp1UaAJ2Hax"

export const logShopActivity = async (log: ShopActivityModel) => {
  if(appEnv != "dev" && appEnv != "prod") return;
  const amount = log.amount
  const currencyType = log.currencyType == ShopCurrencyType.USD? "usd" : "gp"
  const content = `
  ${getDevKeyForDiscord()}${log.userId} just bought ${log.itemInfo} with ${amount} ${currencyType}
  `

  const data = {
    content: content,
  }
  return discordWebhookClient(
    DISCORD_WEBHOOK_CREATE_API_SHOP,
    JSON.stringify(data)
  )
}