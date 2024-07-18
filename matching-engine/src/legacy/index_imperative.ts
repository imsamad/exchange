/**
 * Introduction:
 * The matching-engine written by harkirat in OOP fashion,
 * that OOP code was flat out in procedural fashion in this file
 *
 * Purpose:
 * It is easy to understand the complex code by procedural way by giving it a
 * aggressive reading from top-to-bottom.
 */

import { createClient } from "redis";

type market_string = string;

abstract class Engine {
  private order_books?: Record<market_string, Market_Order_Book>;
  private user_balances?: Record<string, UserBalance>;

  abstract process(): any;

  abstract checkAndLockAccount(): any;

  abstract matchAndCreateOrder(): any;

  abstract updateBalance(): any;
}

const client = createClient({
  url: process.env.REDIS_URL!,
});

client
  .connect()
  .then(() => {
    console.log("connected redis");
  })
  .catch((err) => {
    console.error("err while connecting to redis: ");
    console.error(err);
  });

const bids = [];
const asks = [];

interface BidOrAskOrder {
  price: number;
  quantity: number;
  orderId: string;
  filled: number;
  side: "buy" | "sell";
  userId: string;
}

interface Market_Order_Book {
  bids: BidOrAskOrder[];
  asks: BidOrAskOrder[];
  baseAsset: string;
  quoteAsset: string;
  lastTradeId: number;
  currentPrice: number;
}

// market = base_asset + quote_asset
type base_asset = string;
type quote_asset = string;

type market = string;
type ticker = market;

const order_books: Record<ticker, Market_Order_Book> = {};

order_books.TATA_INR = {
  baseAsset: "TATA",
  quoteAsset: "INR",
  bids: [],
  asks: [],
  lastTradeId: 0,
  currentPrice: 0,
};

interface AssetBalance {
  available: number;
  lock: number;
}

type UserBalance = Record<base_asset | quote_asset, AssetBalance>;

type UserId = string;

type UserBalanceMap = Record<UserId, UserBalance>;

const user_balances: UserBalanceMap = {
  123: {
    TATA: {
      available: 1000,
      lock: 0,
    },
    INR: {
      available: 1000,
      lock: 0,
    },
  },
  456: {
    TATA: {
      available: 1000,
      lock: 0,
    },
    INR: {
      available: 1000,
      lock: 0,
    },
  },
};

const main = async () => {
  while (1) {
    try {
      const orderTmp = await client.brPop("LIMIT_ORDER", 0);
      let order: MessageFromApi = JSON.parse(
        // @ts-ignore
        orderTmp?.element
      ) as unknown as MessageFromApi;

      if (order.type == CREATE_ORDER) {
        // 1.find relevent order book
        // 2. if exist, check and lock user balance
        // 3. execute match

        if (!order_books[order.data.market]) {
          // error handling logic
        } else {
          // step - 2: check and lock user account
          const baseAsset = order.data.market.split(" ")[0];
          const quoteAsset = order.data.market.split(" ")[1];

          if (order.data.side == "buy") {
            if (
              user_balances[order.data.userId][quoteAsset].available <=
              Number(order.data.price) * Number(order.data.quantity)
            ) {
              user_balances[order.data.userId][quoteAsset].available =
                user_balances[order.data.userId][quoteAsset].available -=
                  Number(order.data.price) * Number(order.data.quantity);

              user_balances[order.data.userId][quoteAsset].lock = user_balances[
                order.data.userId
              ][quoteAsset].lock +=
                Number(order.data.price) * Number(order.data.quantity);
            } else {
              // throw
            }
          } else {
            if (
              user_balances[order.data.userId][baseAsset].available <=
              Number(order.data.quantity)
            ) {
              user_balances[order.data.userId][baseAsset].available =
                user_balances[order.data.userId][baseAsset].available -= Number(
                  order.data.quantity
                );
              user_balances[order.data.userId][baseAsset].lock = user_balances[
                order.data.userId
              ][baseAsset].lock += Number(order.data.quantity);
            }
          }

          // step - 2: complete

          const newOrder: BidOrAskOrder = {
            price: Number(order.data.price),
            quantity: Number(order.data.quantity),
            orderId: Math.random().toString(36).substring(2, 25),
            filled: 0,
            side: order.data.side,
            userId: order.data.userId,
          };

          const fills = [];

          let executedQty = 0;

          // step - 3: execute matching start
          if (order.data.side == "buy") {
            while (
              order_books[order.data.market].asks.length &&
              newOrder.quantity
            ) {
              const bestAsk = order_books[order.data.market].asks[0];

              if (bestAsk.price > newOrder.price) break;

              order_books[order.data.market].currentPrice = bestAsk.price;

              let qty = Math.min(bestAsk.quantity, newOrder.quantity);

              executedQty += qty;
              order_books[order.data.market].asks[0].quantity -= qty;
              order_books[order.data.market].asks[0].filled += qty;

              newOrder.quantity -= qty;
              newOrder.filled += qty;

              fills.push({
                tradeId: order_books[order.data.market].lastTradeId++,
                quantity: qty,
                otherUserId: order_books[order.data.market].asks[0].userId,
                price: order_books[order.data.market].asks[0].price,
                orderId: order_books[order.data.market].asks[0].orderId,
              });

              if (order_books[order.data.market].asks[0].quantity == 0)
                order_books[order.data.market].asks.shift();
            }

            if (!newOrder.quantity) {
              order_books[order.data.market].bids.push(newOrder);
              order_books[order.data.market].bids = order_books[
                order.data.market
              ].bids.sort((a, b) => a.price - b.price);
            }
          } else {
            while (
              order_books[order.data.market].bids.length &&
              newOrder.quantity
            ) {
              const bestBid = order_books[order.data.market].bids[0];

              if (bestBid.price < newOrder.price) break;

              order_books[order.data.market].currentPrice = bestBid.price;

              const filledQty = Math.min(newOrder.quantity, bestBid.quantity);

              executedQty += filledQty;

              order_books[order.data.market].bids[0].quantity -=
                newOrder.quantity;

              order_books[order.data.market].bids[0].filled += newOrder.filled;

              newOrder.quantity -= newOrder.quantity;

              newOrder.filled += newOrder.filled;

              fills.push({
                tradeId: order_books[order.data.market].lastTradeId++,
                quantity: filledQty,
                otherUserId: order_books[order.data.market].bids[0].userId,
                price: newOrder.price,
                orderId: order_books[order.data.market].bids[0].orderId,
              });
            }

            if (!newOrder.quantity) {
              order_books[order.data.market].asks.push(newOrder);
              order_books[order.data.market].asks = order_books[
                order.data.market
              ].asks.sort((a, b) => b.price - a.price);
            }
          }
          // step - 3: execute matching end

          // step - 4: transfer balance bewteen user
          if (executedQty) {
            if (order.data.side == "buy") {
              fills.forEach((fill) => {
                user_balances[fill.otherUserId][quoteAsset].available =
                  user_balances[fill.otherUserId][quoteAsset].available +
                  newOrder.price * newOrder.quantity;

                user_balances[fill.otherUserId][baseAsset].lock =
                  user_balances[fill.otherUserId][baseAsset].lock -
                  newOrder.quantity;

                user_balances[newOrder.userId][quoteAsset].available =
                  user_balances[newOrder.userId][quoteAsset].available +
                  fill.price * fill.quantity;

                user_balances[newOrder.userId][baseAsset].available =
                  user_balances[newOrder.userId][baseAsset].available -
                  fill.price * fill.quantity;
              });
            }
          } else {
            fills.forEach((fill) => {
              user_balances[fill.otherUserId][quoteAsset].lock =
                user_balances[fill.otherUserId][quoteAsset].lock -
                fill.quantity * fill.price;

              user_balances[fill.otherUserId][baseAsset].available =
                user_balances[fill.otherUserId][baseAsset].available +
                fill.quantity;

              user_balances[newOrder.userId][quoteAsset].available =
                user_balances[newOrder.userId][quoteAsset].available +
                fill.quantity * fill.price;

              user_balances[newOrder.userId][baseAsset].lock =
                user_balances[newOrder.userId][baseAsset].lock - fill.quantity;
            });
          }
          // step - 4: transfer balance bewteen user end
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
};

main();

export type MessageFromApi =
  | {
      type: typeof CREATE_ORDER;
      data: {
        market: string;
        price: string;
        quantity: string;
        side: "buy" | "sell";
        userId: string;
      };
    }
  | {
      type: typeof CANCEL_ORDER;
      data: {
        orderId: string;
        market: string;
      };
    }
  | {
      type: typeof ON_RAMP;
      data: {
        amount: string;
        userId: string;
        txnId: string;
      };
    }
  | {
      type: typeof GET_DEPTH;
      data: {
        market: string;
      };
    }
  | {
      type: typeof GET_OPEN_ORDERS;
      data: {
        userId: string;
        market: string;
      };
    };
export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";

export const GET_DEPTH = "GET_DEPTH";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";
