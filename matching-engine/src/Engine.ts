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
import fs from "fs";

abstract class TEngine {
  abstract orderBooks: Record<string, TOrderBook>;
  abstract userBalances: Record<TUserId, TUserBalance>;

  abstract process({}: { message: MessageFromApi; clientId: string }): void;
  abstract createOrder(order: IncomingOrder): MessageToApi;
  abstract checkAndLockBalance(order: TOrder): void;

  abstract updateBalance(order: TOrder, fills: TFill[]): void;

  abstract createDbTrade(fills: TFill[]): void;

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

    if (this.orderBooks[ticker]) throw new Error("already exist");

    this.orderBooks[ticker] = new OrderBook({
      baseAsset: "TATA",
      quoteAsset: "INR",
    });
  }

  constructor() {
    let snapshot = null;

    try {
      if (process.env.WITH_SNAPSHOT)
        snapshot = fs.readFileSync("./snapshot.json");
    } catch (e) {
      console.log("No snapshot found");
    }

    if (snapshot) this.restoreSnapshot(snapshot);
    else this.init();
    setInterval(this.saveSnapshot, 3000);
  }

  init() {
    this.orderBooks = {
      [OrderBook.getTicker("TATA", "INR")]: new OrderBook({
        baseAsset: "TATA",
        quoteAsset: "INR",
      }),
    };

    this.userBalances = {
      "123": {
        TATA: {
          available: 10000,
          locked: 0,
        },
        INR: {
          available: 10000,
          locked: 0,
        },
      },
    };
  }
  restoreSnapshot(snapshot: any) {
    snapshot = JSON.parse(snapshot.toString());

    this.orderBooks = snapshot.orderBooks.map((ob: any) => {
      return new OrderBook(ob);
    });

    this.userBalances = snapshot.userBalaces;
  }
  saveSnapshot() {
    fs.writeFileSync(
      "./snapshot.json",
      JSON.stringify({
        orderBooks: Object.keys(this.orderBooks).map((key) => ({
          [key]: this.orderBooks[key].getSnapShot(),
        })),
        userBalances: this.userBalances,
      })
    );
  }
  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }): void {
    if (message.type == "CREATE_ORDER") {
      try {
        const payload = this.createOrder(message.payload);

        RedisManager.getInstance().sendToApi(clientId, payload);
      } catch (err) {
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
      this.onRamp(
        message.payload.userId,
        message.payload.amount,
        message.payload.quoteAsset
      );
    } else if (message.type == "ORDER_CANCELLED") {
      try {
        if (!this.orderBooks[message.payload.market])
          throw new Error("does not exist");

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

        if (!order) return;
        const base_asset = order.market.split("_")[0];
        const quote_asset = order.market.split("_")[1];

        if (order.side == "buy") {
          this.orderBooks[message.payload.market].cancelBid(order.orderId);

          this.userBalances[message.payload.userId][quote_asset].available +=
            order.price * (order.quantity - order.filled);
          this.userBalances[message.payload.userId][quote_asset].locked -=
            order.price * (order.quantity - order.filled);
        } else {
          this.orderBooks[message.payload.market].cancelAsk(order.orderId);

          this.userBalances[message.payload.userId][base_asset].available +=
            order.quantity - order.filled;
          this.userBalances[message.payload.userId][base_asset].locked -=
            order.quantity - order.filled;
        }
        this.sendUpdatedDepthAt(order.price, message.payload.market);
      } catch (err) {}
    } else if (message.type == "ADD_ORDERBOOK") {
      try {
        this.addOrderBook(
          message.payload.baseAsset,
          message.payload.quoteAsset
        );

        RedisManager.getInstance().sendToApi(clientId, {
          type: "ADDED_ORDERBOOK",
          payload: {
            message: "success",
          },
        });
      } catch (error) {}
    }
  }

  public createOrder(incomingOrder: IncomingOrder): MessageToApi {
    const orderBook = this.orderBooks[incomingOrder.market];
    if (!orderBook) throw new Error("market does not exist!");

    const order: TOrder = {
      ...incomingOrder,
      orderId: Math.random().toString().slice(2),
      filled: 0,
    };

    this.checkAndLockBalance(order);

    const { filledQty, fills } = orderBook.addOrder(order);

    this.updateBalance(order, fills);

    this.createDbTrade(fills);

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
    const userBalace = this.userBalances[order.userId];
    if (!userBalace) throw new Error("add funds");

    const baseAsset = order.market.split("_")[0];
    const quoteAsset = order.market.split("_")[1];

    if (order.side == "buy") {
      const reqAmount = order.price * order.quantity;
      if (userBalace[quoteAsset].available < reqAmount)
        throw new Error("insufficient funds");

      userBalace[quoteAsset].available -= reqAmount;
      userBalace[quoteAsset].locked += reqAmount;
    } else {
      if (userBalace[baseAsset].available < order.quantity)
        throw new Error("insufficient funds");

      userBalace[baseAsset].available -= order.quantity;
      userBalace[baseAsset].locked += order.quantity;
    }

    this.userBalances[order.userId] = userBalace;
  }

  updateBalance(order: TOrder, fills: TFill[]): void {
    fills.forEach((fill) => {
      const baseAsset = order.market.split("_")[0];
      const quoteAsset = order.market.split("_")[1];

      if (order.side == "buy") {
        const buyerUserBalance = this.userBalances[fill.userId];
        const sellerUserBalance = this.userBalances[fill.otherUserId];

        buyerUserBalance[baseAsset].available += fill.quantity;
        buyerUserBalance[quoteAsset].locked -= fill.quantity * fill.price;

        sellerUserBalance[baseAsset].locked -= fill.quantity;
        sellerUserBalance[quoteAsset].available += fill.quantity * fill.price;

        this.userBalances[fill.userId] = buyerUserBalance;
        this.userBalances[fill.otherUserId] = sellerUserBalance;
      } else {
        const sellerUserBalance = this.userBalances[fill.userId];
        const buyerUserBalance = this.userBalances[fill.otherUserId];

        sellerUserBalance[quoteAsset].available += fill.quantity * fill.price;
        sellerUserBalance[baseAsset].locked -= fill.quantity;

        buyerUserBalance[baseAsset].available += fill.quantity;
        buyerUserBalance[quoteAsset].locked -= fill.quantity * fill.price;
      }
    });
  }

  createDbTrade(fills: TFill[]): void {
    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: "TRADE_ADDED",
        payload: fill,
      });
    });
  }

  publisWsDepthUpdates(fills: TFill[], order: TOrder) {
    const depth = this.orderBooks[order.market].getDepth();
    const fillsPrice = fills.map((f) => f.price);
    if (order.side == "buy") {
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

  onRamp(userId: TUserId, amount: TPrice, quoteAsset: TQuote_Aasset): void {
    if (!this.userBalances[userId]) {
      this.userBalances[userId] = {
        [quoteAsset]: {
          available: amount,
          locked: 0,
        },
      };
    } else {
      this.userBalances[userId][quoteAsset].available += amount;
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
