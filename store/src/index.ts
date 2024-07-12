import { createClient } from "redis";
import { DBMessage } from "./types";
import { createTables } from "./createTable";
import { connectPgWithRetry } from "./connect-pg";
import { migrate } from "./migrate";

connectPgWithRetry().then((pgClient) => {
  console.log("): pg connected!");
  migrate().then(async () => {
    console.log("): migrated successfully.");
    if (!pgClient) return;

    try {
      const redisClient = createClient({
        url: process.env.REDIS_URL,
      });
      await redisClient.connect();
      console.log("): connected to redis");
      console.log("): store running!");
      return;
      while (true) {
        const response = await redisClient.brPop("db_processor" as string, 0);
        console.log(response);
        // if (!response) {
        // } else {
        //   const data: DBMessage = JSON.parse(response);

        //   if (data.type === "TRADE_ADDED") {
        //     const price = data.payload.fill.price;
        //     const timestamp = new Date(data.payload.fill.timestamp);
        //     const ticker = data.payload.market;

        //     const query = `INSERT INTO ${ticker} (time, price) VALUES ($1, $2)`;

        //     const values = [timestamp, price];
        //     await pgClient.query(query, values);
        //     continue;
        //   }

        //   if (data.type == "CREATE_TABLE") {
        //     await createTables(
        //       pgClient,
        //       data.payload.base_asset,
        //       data.payload.quote_asset
        //     );
        //     continue;
        //   }
        // }
      }
    } catch (error) {
      console.log("error: ", error);
      process.exit();
    }
  });
});
