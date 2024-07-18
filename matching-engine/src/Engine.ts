import fs from "fs";

import { OrderBook, TOrderBook } from "./OrderBook";
import { RedisManager } from "./RedisManager";

import {
  IncomingOrder,
  MessageFromApi,
  MessageToApi,
  TBase_Asset,
  TFill,
  TMarket_Str,
  TOrder,
  TPrice,
  TQuote_Aasset,
  TUserBalance,
  TUserId,
} from "./types";

class CustomError extends Error {
  errMsg: any;
  constructor(errMsg: any) {
    super();
    this.errMsg = errMsg;
  }
}

abstract class TEngine {
  abstract orderBooks: Record<string, TOrderBook>;
  abstract userBalances: Record<TUserId, TUserBalance>;

  abstract process({}: { message: MessageFromApi; clientId: string }): void;
  abstract createOrder(order: IncomingOrder): MessageToApi;
  abstract checkAndLockBalance(order: TOrder): void;

  abstract updateBalance(order: TOrder, fills: TFill[]): void;

  abstract sendUpdatedBalance(order: TOrder, fills: TFill[]): void;

  abstract createDbTrade(fills: TFill[], market: TMarket_Str): void;

  abstract publisWsDepthUpdates(fills: TFill[], order: TOrder): void;

  abstract publishWsTrades(fills: TFill[], market: TMarket_Str): void;

  abstract onRamp(
    userId: TUserId,
    amount: TPrice,
    quoteAsset: TQuote_Aasset
  ): void;

  abstract sendUpdatedDepthAt(price: TPrice, market: TMarket_Str): void;

  abstract addOrderBook(
    base_asset: TBase_Asset,
    quote_asset: TQuote_Aasset
  ): void;
}

export class Engine implements TEngine {
  orderBooks: Record<TUserId, TOrderBook> = {};
  userBalances: Record<TUserId, TUserBalance> = {};
  addOrderBook(base_asset: TBase_Asset, quote_asset: TQuote_Aasset): void {
    const ticker = OrderBook.getTicker(base_asset, quote_asset);

    if (this.orderBooks[ticker]) throw new CustomError("already exist");

    this.orderBooks[ticker] = new OrderBook({
      baseAsset: base_asset,
      quoteAsset: quote_asset,
    });
  }

  constructor() {
    let snapshot = null;

    try {
      snapshot = fs.readFileSync("./snapshot.json");
    } catch (e) {
      console.log("No snapshot found");
    }

    if (snapshot) {
      console.log("snapshot found");
      this.restoreSnapshot(snapshot);
    } else {
      // this.init();
    }

    setInterval(() => {
      this.saveSnapshot(this.orderBooks, this.userBalances);
    }, 4000);
  }

  init() {
    this.orderBooks = {
      [OrderBook.getTicker("tata", "inr")]: new OrderBook({
        baseAsset: "tata",
        quoteAsset: "inr",
      }),
    };

    this.userBalances = {
      "123": {
        tata: {
          available: 10000,
          locked: 0,
        },
        inr: {
          available: 10000,
          locked: 0,
        },
      },
    };
  }

  restoreSnapshot(snapshot: any) {
    snapshot = JSON.parse(snapshot.toString());

    snapshot.orderBooks.map((o: any) => {
      this.orderBooks[o[0]] = new OrderBook(o[1]);
    });

    this.userBalances = JSON.parse(JSON.stringify(snapshot.userBalances));
  }

  saveSnapshot(
    orderBooks: Record<TMarket_Str, TOrderBook>,
    userBalances: Record<TUserId, TUserBalance>
  ) {
    const snap = {
      orderBooks: Object.keys(orderBooks).map((key) => {
        return [key, orderBooks[key].getSnapShot()];
      }),
      userBalances: userBalances,
    };

    fs.writeFileSync("./snapshot.json", JSON.stringify(snap, null, 4));
  }

  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }): void {
    console.log("processing: ", message);
    if (message.type == "CREATE_ORDER") {
      try {
        message.payload.price = Number(message.payload.price);
        message.payload.quantity = Number(message.payload.quantity);
        message.payload.market = message.payload.market.toLowerCase();

        const payload = this.createOrder(message.payload);

        RedisManager.getInstance().sendToApi(clientId, payload);
      } catch (err) {
        console.error("error at: ", message.type);
        console.error(err);

        RedisManager.getInstance().sendToApi(clientId, {
          type: "ORDER_PLACED",
          payload: {
            filledQty: 0,
            fills: [],
            orderId: "",
          },
        });
      }
    } else if (message.type == "GET_DEPTH") {
      message.payload.market = message.payload.market.toLowerCase();

      if (!this.orderBooks[message.payload.market]) {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "DEPTH",
          payload: {
            bids: [],
            asks: [],
            currentPrice: 0,
          },
        });
        return;
      }

      const depth = this.orderBooks[message.payload.market].getDepth();

      RedisManager.getInstance().sendToApi(clientId, {
        type: "DEPTH",
        payload: {
          ...depth,
          currentPrice: this.orderBooks[message.payload.market].currentPrice,
        },
      });
    } else if (message.type == "OPEN_ORDERS") {
      message.payload.market = message.payload.market.toLowerCase();

      if (!this.orderBooks[message.payload.market]) {
        RedisManager.getInstance().sendToApi(clientId, {
          type: "OPEN_ORDERS",
          payload: this.orderBooks[message.payload.market].getOpenOrders(
            message.payload.userId
          ),
        });
        return;
      }
    } else if (message.type == "ON_RAMP") {
      try {
        this.onRamp(
          message.payload.userId,
          message.payload.amount,
          message.payload.asset.toLowerCase()
        );

        RedisManager.getInstance().sendToApi(clientId, {
          type: "ON_RAMP",
          payload: {
            error: false,
          },
        });
      } catch (err) {
        console.error("error at: ", message.type);
        console.error(err);

        RedisManager.getInstance().sendToApi(clientId, {
          type: "ON_RAMP",
          payload: {
            error: true,
          },
        });
      }
    } else if (message.type == "ORDER_CANCELLED") {
      try {
        if (!this.orderBooks[message.payload.market])
          throw new CustomError("orderbook does not exist");

        const order =
          this.orderBooks[message.payload.market].asks.find(
            ({ orderId, userId }) =>
              orderId == message.payload.orderId &&
              userId == message.payload.userId
          ) ||
          this.orderBooks[message.payload.market].bids.find(
            ({ orderId, userId }) =>
              orderId == message.payload.orderId &&
              userId == message.payload.userId
          );

        if (!order)
          throw new CustomError("order not found, do not play shitty buddy!");

        const base_asset = order.market.split("_")[0];
        const quote_asset = order.market.split("_")[1];

        if (order.side == "bid") {
          this.orderBooks[message.payload.market].cancelBid(order.orderId);

          this.userBalances[message.payload.userId][quote_asset].available +=
            order.price * (order.quantity - order.filled);

          this.userBalances[message.payload.userId][quote_asset].locked -=
            order.price * (order.quantity - order.filled);

          RedisManager.getInstance().pushMessage({
            type: "BALANCE_UPDATES",
            payload: {
              updatedBalances: [
                {
                  asset: quote_asset,
                  userId: order.userId,
                  balance:
                    this.userBalances[message.payload.userId][quote_asset],
                },
              ],
            },
          });
        } else {
          this.orderBooks[message.payload.market].cancelAsk(order.orderId);

          this.userBalances[message.payload.userId][base_asset].available +=
            order.quantity - order.filled;

          this.userBalances[message.payload.userId][base_asset].locked -=
            order.quantity - order.filled;

          RedisManager.getInstance().pushMessage({
            type: "BALANCE_UPDATES",
            payload: {
              updatedBalances: [
                {
                  asset: base_asset,
                  userId: order.userId,
                  balance:
                    this.userBalances[message.payload.userId][base_asset],
                },
              ],
            },
          });
        }

        RedisManager.getInstance().sendToApi(clientId, {
          type: "ORDER_CANCELLED",
          payload: {
            message: "success",
          },
        });

        this.sendUpdatedDepthAt(order.price, message.payload.market);
      } catch (err) {
        console.error("error at: ", message.type);
        console.error(err);

        RedisManager.getInstance().sendToApi(clientId, {
          type: "ORDER_CANCELLED",
          payload: {
            message: "error",
          },
        });
      }
    } else if (message.type == "ADD_ORDERBOOK") {
      try {
        this.addOrderBook(
          message.payload.baseAsset.toLowerCase(),
          message.payload.quoteAsset.toLowerCase()
        );

        RedisManager.getInstance().sendToApi(clientId, {
          type: "ADDED_ORDERBOOK",
          payload: {
            message: "success",
          },
        });
      } catch (error) {
        console.error("error at: ", message.type);
        console.error(error);

        RedisManager.getInstance().sendToApi(clientId, {
          type: "ADDED_ORDERBOOK",
          payload: {
            message: "error",
          },
        });
      }
    }
  }

  public createOrder(incomingOrder: IncomingOrder): MessageToApi {
    const orderBook = this.orderBooks[incomingOrder.market];

    if (!orderBook) throw new CustomError("market does not exist!");

    const order: TOrder = {
      ...incomingOrder,
      orderId: Math.random().toString().slice(2),
      filled: 0,
    };

    this.checkAndLockBalance(order);

    const { filledQty, fills } = orderBook.addOrder(order);

    this.updateBalance(order, fills);

    this.sendUpdatedBalance(order, fills);

    this.createDbTrade(fills, order.market);

    // this.updateDbOrders(order, executedQty, fills, market);

    this.publisWsDepthUpdates(fills, order);

    this.publishWsTrades(fills, order.market);

    return {
      type: "ORDER_PLACED",
      payload: {
        orderId: order.orderId,
        filledQty,
        fills: fills.map(({ price, tradeId, quantity }) => ({
          price,
          tradeId,
          quantity,
        })),
      },
    };
  }

  public checkAndLockBalance(order: TOrder): void {
    let userBalace = this.userBalances[order.userId];

    if (!userBalace) throw new CustomError("add funds");

    const baseAsset = order.market.split("_")[0];
    const quoteAsset = order.market.split("_")[1];

    if (order.side == "bid") {
      if (!userBalace[quoteAsset])
        throw new CustomError("assets not in account");

      const reqAmount = order.price * order.quantity;

      if (userBalace[quoteAsset].available < reqAmount)
        throw new CustomError("insufficient funds");

      userBalace[quoteAsset].available -= reqAmount;
      userBalace[quoteAsset].locked += reqAmount;
    } else {
      if (!userBalace[baseAsset])
        throw new CustomError("assets not in account");

      if (userBalace[baseAsset].available < order.quantity)
        throw new CustomError("insufficient funds");

      userBalace[baseAsset].available -= order.quantity;
      userBalace[baseAsset].locked += order.quantity;
    }

    this.userBalances[order.userId] = userBalace;
  }

  updateBalance(order: TOrder, fills: TFill[]): void {
    fills.forEach((fill) => {
      const baseAsset = order.market.split("_")[0];
      const quoteAsset = order.market.split("_")[1];

      if (order.side == "bid") {
        let buyerUserBalance = this.userBalances[fill.userId];
        let sellerUserBalance = this.userBalances[fill.otherUserId];

        // it might happen, buyer does not have base asset entry in userBalances
        // buyer would have quoteAsset definitely otherwise would have been thrown error in checkAndLockBalance method

        if (!buyerUserBalance[baseAsset]) {
          this.userBalances[fill.userId][baseAsset] = {
            available: 0,
            locked: 0,
          };
          buyerUserBalance = this.userBalances[fill.userId];
        }

        // it might happen, seller does not have quote asset entry in userBalances
        // seller would have baseAsset definitely otherwise would have been thrown error in checkAndLockBalance method

        if (!sellerUserBalance[quoteAsset]) {
          this.userBalances[fill.otherUserId][quoteAsset] = {
            available: 0,
            locked: 0,
          };
          sellerUserBalance = this.userBalances[fill.otherUserId];
        }

        buyerUserBalance[baseAsset].available += fill.quantity;
        buyerUserBalance[quoteAsset].locked -= fill.quantity * fill.price;

        sellerUserBalance[baseAsset].locked -= fill.quantity;
        sellerUserBalance[quoteAsset].available += fill.quantity * fill.price;

        this.userBalances[fill.userId] = buyerUserBalance;
        this.userBalances[fill.otherUserId] = sellerUserBalance;
      } else {
        let sellerUserBalance = this.userBalances[fill.userId];
        let buyerUserBalance = this.userBalances[fill.otherUserId];

        // it might happen, buyer does not have base asset entry in userBalances
        // buyer would have quoteAsset definitely otherwise would have been thrown error in checkAndLockBalance method

        if (!buyerUserBalance[baseAsset]) {
          this.userBalances[fill.userId][baseAsset] = {
            available: 0,
            locked: 0,
          };
          buyerUserBalance = this.userBalances[fill.userId];
        }

        // it might happen, seller does not have quote asset entry in userBalances
        // seller would have baseAsset definitely otherwise would have been thrown error in checkAndLockBalance method

        if (!sellerUserBalance[quoteAsset]) {
          this.userBalances[fill.otherUserId][quoteAsset] = {
            available: 0,
            locked: 0,
          };
          sellerUserBalance = this.userBalances[fill.otherUserId];
        }

        sellerUserBalance[quoteAsset].available += fill.quantity * fill.price;
        sellerUserBalance[baseAsset].locked -= fill.quantity;

        buyerUserBalance[baseAsset].available += fill.quantity;
        buyerUserBalance[quoteAsset].locked -= fill.quantity * fill.price;
      }
    });
  }

  sendUpdatedBalance(order: TOrder, fills: TFill[]) {
    const base_asset = order.market.split("_")[0];
    const quote_asset = order.market.split("_")[1];

    const updatedBalances: any = [];
    if (!fills.length) {
      if (order.side == "bid") {
        updatedBalances.push({
          userId: order.userId,
          asset: quote_asset,
          balance: this.userBalances[order.userId][quote_asset],
        });
      } else {
        updatedBalances.push({
          userId: order.userId,
          asset: base_asset,
          balance: this.userBalances[order.userId][base_asset],
        });
      }

      RedisManager.getInstance().pushMessage({
        type: "BALANCE_UPDATES",
        payload: {
          updatedBalances,
        },
      });

      return;
    }

    const users = [
      order.userId,
      ...new Set(fills.map(({ otherUserId }) => otherUserId)),
    ];

    const updatedBalance = users.map((userId) => [
      {
        userId: userId,
        asset: base_asset,
        balance: this.userBalances[userId][base_asset],
      },
      {
        userId: userId,
        asset: quote_asset,
        balance: this.userBalances[userId][quote_asset],
      },
    ]);

    RedisManager.getInstance().pushMessage({
      type: "BALANCE_UPDATES",
      payload: { updatedBalances: updatedBalance.flat() },
    });
  }

  createDbTrade(fills: TFill[], market: TMarket_Str): void {
    RedisManager.getInstance().pushMessage({
      type: "TRADE_ADDED",
      payload: { fills, market },
    });
  }

  publisWsDepthUpdates(fills: TFill[], order: TOrder) {
    const depth = this.orderBooks[order.market].getDepth();
    const fillsPrice = fills.map((f) => f.price);

    if (order.side == "bid") {
      // get the depth at all price at which trade happend
      // const updatedAsks = fillsPrice
      //   .map((fPrice) => depth.asks.find(([price]) => price == fPrice))
      //   .filter((x) => (x == "undefined" ? false : true));

      const updatedAsks = depth.asks.filter((ask) =>
        fillsPrice.includes(ask[0])
      );

      const updatedBids = depth.bids.find((bid) => bid[0] == order.price);

      RedisManager.getInstance().publishMessage(`depth@${order.market}`, {
        stream: `depth@${order.market}`,
        data: {
          a: updatedAsks,
          b: updatedBids ? [updatedBids] : [],
          e: "depth",
        },
      });
    } else {
      const updatedBids = depth.bids.filter((bid) =>
        fillsPrice.includes(bid[0])
      );

      const updatedAsks = depth.asks.find((ask) => ask[0] == order.price);

      RedisManager.getInstance().publishMessage(`depth@${order.market}`, {
        stream: `depth@${order.market}`,
        data: {
          a: updatedAsks ? [updatedAsks] : [],
          b: updatedBids,
          e: "depth",
        },
      });
    }
  }

  publishWsTrades(fills: TFill[], market: TMarket_Str) {
    fills.forEach((fill) => {
      RedisManager.getInstance().publishMessage(`trade@${market}`, {
        stream: `trade@${market}`,
        data: {
          e: "trade",
          t: fill.tradeId,
          m: fill.otherOrderId == fill.userId,
          p: fill.price,
          q: fill.quantity,
          s: market,
        },
      });
    });
  }

  onRamp(userId: TUserId, amount: TPrice, asset: TQuote_Aasset): void {
    if (!this.userBalances[userId]) {
      this.userBalances[userId] = {
        [asset]: {
          available: amount,
          locked: 0,
        },
      };
    } else {
      if (!this.userBalances[userId]?.[asset])
        this.userBalances[userId][asset] = { available: 0, locked: 0 };

      this.userBalances[userId][asset].available += amount;
    }
  }

  sendUpdatedDepthAt(price: TPrice, market: TMarket_Str): void {
    const depth = this.orderBooks[market].getDepth();

    const updatedBids = depth.bids.filter((bid) => bid[0] == price);

    const updatedAsks = depth.asks.filter((bid) => bid[0] == price);

    RedisManager.getInstance().publishMessage(`depth@${market}`, {
      stream: `depth@${market}`,
      data: {
        a: updatedAsks.length ? updatedAsks : [[price, 0]],
        b: updatedBids.length ? updatedBids : [[price, 0]],
        e: "depth",
      },
    });
  }
}
