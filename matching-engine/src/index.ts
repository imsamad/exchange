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
      const msg = await redisClient.rPop("messages");

      if (msg) {
        console.log("msg: ", msg);
        engine.process(JSON.parse(msg));
      }
    }
  } catch (err) {
    console.log("err: ", err);
  }
})();
