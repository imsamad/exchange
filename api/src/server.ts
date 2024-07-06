import "express-async-errors";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { CustomeError } from "./libs/CustomError";
import { ErrorHandler } from "./middlewares/ErrorHandler";
import { createClient } from "redis";
const appInstance = express();

appInstance.use(express.json()).use(cors()).use(morgan("dev"));

const client = createClient({
  url: process.env.REDIS_URL!,
});

const publish = createClient({
  url: process.env.REDIS_URL!,
});

publish.connect();
client
  .connect()
  .then(() => {
    console.log("connected redis");
  })
  .catch((err) => {
    console.log("err: ", err);
  });

appInstance.post("/limitorder", async (req, res) => {
  const sendAndWait = () =>
    new Promise((resolve, reject) => {
      const clientId =
        Math.random().toString().slice(2, 10) +
        Math.random().toString().slice(2, 10);

      client.lPush(
        "messages",
        JSON.stringify({
          clientId,
          message: { type: "CREATE_ORDER", payload: { ...req.body } },
        })
      );

      publish.subscribe(clientId, (message) => {
        resolve(message);
      });
    });
  const message = await sendAndWait();
  console.log("message:L ", message);
  res.json({
    message: 1,
  });
});

appInstance.use(() => {
  throw new CustomeError(404, "Not Found!");
});

appInstance.use(ErrorHandler);

export { appInstance };
