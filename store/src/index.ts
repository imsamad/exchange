require("dotenv").config();
import { createClient } from "redis";
import { connectPgWithRetry } from "./connect-pg";
import { DBMessage } from "./types";
import { updateBalance } from "./updateBalances";
import { tradeAdded } from "./tradeAdded";

connectPgWithRetry().then(async (pgClient) => {
  if (!pgClient) return;
  console.log("): pg connected!");

  try {
    const redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    await redisClient.connect();
    console.log("): connected to redis");
    console.log("): store running!");

    while (true) {
      const response = await redisClient.brPop("db_processor" as string, 0);
      if (!response) continue;

      const message: DBMessage = JSON.parse(response.element);
      console.log("processing: ", message);
      if (message.type == "BALANCE_UPDATES") {
        await updateBalance(message, pgClient);
      } else if (message.type == "TRADE_ADDED") {
        await tradeAdded(message, pgClient);
      }
    }
  } catch (error) {
    console.error("error from: ", error);
    process.exit();
  }
});
