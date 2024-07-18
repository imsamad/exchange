import "express-async-errors";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { CustomeError } from "./libs/CustomError";
import { ErrorHandler } from "./middlewares/ErrorHandler";

import { authMiddleware } from "./middlewares/auth";
import { createTables } from "./libs/createTable";
import { RedisManager } from "./libs/RedisManager";
import { PGManager } from "./libs/PGManager";

const appInstance = express();

appInstance.use(express.json());
appInstance.use(cors());
appInstance.use(morgan("dev"));

appInstance.post("/limitorder", authMiddleware, async (req, res) => {
  const message = await RedisManager.getInstance().sendAndWait({
    type: "CREATE_ORDER",
    payload: {
      price: req.body.price,
      quantity: req.body.quantity,
      market: req.body.market,
      userId: req.currentUser?.id!,
      side: req.body.side,
    },
  });

  res.json(message);
});

appInstance.delete("/limitorder", authMiddleware, async (req, res) => {
  const message = await RedisManager.getInstance().sendAndWait({
    type: "ORDER_CANCELLED",
    payload: {
      market: req.body.market,
      orderId: req.body.orderId,
      userId: req.currentUser?.id!,
    },
  });

  res.json(message.payload);
});

appInstance.get("/depth", async (req, res) => {
  const message = await RedisManager.getInstance().sendAndWait({
    type: "GET_DEPTH",
    payload: {
      market: req.body.market,
    },
  });

  res.json(message.payload);
});

appInstance.get("/openOrderBook", authMiddleware, async (req, res) => {
  const message = await RedisManager.getInstance().sendAndWait({
    type: "OPEN_ORDERS",
    payload: {
      userId: req.currentUser?.id!,
      market: req.body.market,
    },
  });

  res.json(message.payload);
});

appInstance.post("/onramp", authMiddleware, async (req, res) => {
  const userId = req.currentUser?.id!;
  const x = await PGManager.getInstance().getClient().query(`
    select * from markets;
  `);

  const base_assets_ = [
    ...new Set(x.rows.map(({ base_asset }: any) => base_asset)),
  ];

  const quote_assets_ = [
    ...new Set(x.rows.map(({ quote_asset }: any) => quote_asset)),
  ];

  const assets = [...new Set([...base_assets_, ...quote_assets_])];

  const promises: any = [];

  assets.forEach((asset) => {
    promises.push(
      new Promise(async (resolve, reject) => {
        try {
          const q = await PGManager.getInstance()
            .getClient()
            .query(
              `INSERT INTO "balances" (user_id, asset, available, locked) VALUES ($1, $2, $3, $4)  RETURNING *`,
              [userId, asset, 10000, 0]
            );

          const message = await RedisManager.getInstance().sendAndWait({
            type: "ON_RAMP",
            payload: {
              userId: userId,
              amount: 10000,
              txnId: q.rows[0].balance_id,
              asset,
            },
          });

          resolve(message);
        } catch (error) {
          reject(error);
        }
      })
    );
  });

  const result = await Promise.allSettled(promises);

  res.json({ message: "ok", result: result });
});

appInstance.get("/markets", async (req, res) => {
  const q = await PGManager.getInstance().getClient().query(`
      select * from markets;
    `);

  res.json({
    markets: q.rows,
  });
});

appInstance.post("/markets", async (req, res) => {
  await createTables(
    PGManager.getInstance().getClient(),
    req.body.base_asset,
    req.body.quote_asset
  );

  const mes = await RedisManager.getInstance().sendAndWait({
    type: "ADD_ORDERBOOK",
    payload: {
      baseAsset: req.body.base_asset,
      quoteAsset: req.body.quote_asset,
    },
  });

  res.json(mes.payload);
});

appInstance.use(() => {
  throw new CustomeError(404, "Not Found!");
});

appInstance.use(ErrorHandler);

export { appInstance };
