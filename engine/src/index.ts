import { createClient } from "redis";
import { Engine } from "./Engine";

(async () => {
  try {
    const engine = new Engine();

    const redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    await redisClient.connect();
    console.log("engine running");
    while (1) {
      const pop = await redisClient.brPop("messages", 0);
      if (!pop || !pop.element) continue;

      engine.process(JSON.parse(pop.element));
    }
  } catch (err) {
    console.error("err: ", err);
  }
})();
