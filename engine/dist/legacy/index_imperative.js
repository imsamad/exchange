"use strict";
/**
 * Introduction:
 * The matching-engine written by harkirat in OOP fashion,
 * that OOP code was flat out in procedural fashion in this file
 *
 * Purpose:
 * It is easy to understand the complex code by procedural way by giving it a
 * aggressive reading from top-to-bottom.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_OPEN_ORDERS = exports.GET_DEPTH = exports.ON_RAMP = exports.CANCEL_ORDER = exports.CREATE_ORDER = void 0;
const redis_1 = require("redis");
class Engine {
}
const client = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
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
const order_books = {};
order_books.TATA_INR = {
    baseAsset: "TATA",
    quoteAsset: "INR",
    bids: [],
    asks: [],
    lastTradeId: 0,
    currentPrice: 0,
};
const user_balances = {
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
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    while (1) {
        try {
            const orderTmp = yield client.brPop("LIMIT_ORDER", 0);
            let order = JSON.parse(
            // @ts-ignore
            orderTmp === null || orderTmp === void 0 ? void 0 : orderTmp.element);
            if (order.type == exports.CREATE_ORDER) {
                // 1.find relevent order book
                // 2. if exist, check and lock user balance
                // 3. execute match
                if (!order_books[order.data.market]) {
                    // error handling logic
                }
                else {
                    // step - 2: check and lock user account
                    const baseAsset = order.data.market.split(" ")[0];
                    const quoteAsset = order.data.market.split(" ")[1];
                    if (order.data.side == "buy") {
                        if (user_balances[order.data.userId][quoteAsset].available <=
                            Number(order.data.price) * Number(order.data.quantity)) {
                            user_balances[order.data.userId][quoteAsset].available =
                                user_balances[order.data.userId][quoteAsset].available -=
                                    Number(order.data.price) * Number(order.data.quantity);
                            user_balances[order.data.userId][quoteAsset].lock = user_balances[order.data.userId][quoteAsset].lock +=
                                Number(order.data.price) * Number(order.data.quantity);
                        }
                        else {
                            // throw
                        }
                    }
                    else {
                        if (user_balances[order.data.userId][baseAsset].available <=
                            Number(order.data.quantity)) {
                            user_balances[order.data.userId][baseAsset].available =
                                user_balances[order.data.userId][baseAsset].available -= Number(order.data.quantity);
                            user_balances[order.data.userId][baseAsset].lock = user_balances[order.data.userId][baseAsset].lock += Number(order.data.quantity);
                        }
                    }
                    // step - 2: complete
                    const newOrder = {
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
                        while (order_books[order.data.market].asks.length &&
                            newOrder.quantity) {
                            const bestAsk = order_books[order.data.market].asks[0];
                            if (bestAsk.price > newOrder.price)
                                break;
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
                            order_books[order.data.market].bids = order_books[order.data.market].bids.sort((a, b) => a.price - b.price);
                        }
                    }
                    else {
                        while (order_books[order.data.market].bids.length &&
                            newOrder.quantity) {
                            const bestBid = order_books[order.data.market].bids[0];
                            if (bestBid.price < newOrder.price)
                                break;
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
                            order_books[order.data.market].asks = order_books[order.data.market].asks.sort((a, b) => b.price - a.price);
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
                    }
                    else {
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
        }
        catch (err) {
            console.log(err);
        }
    }
});
main();
exports.CREATE_ORDER = "CREATE_ORDER";
exports.CANCEL_ORDER = "CANCEL_ORDER";
exports.ON_RAMP = "ON_RAMP";
exports.GET_DEPTH = "GET_DEPTH";
exports.GET_OPEN_ORDERS = "GET_OPEN_ORDERS";
