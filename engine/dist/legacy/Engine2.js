"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = void 0;
const RedisManager_1 = require("../RedisManager");
class TEngineT {
    constructor() {
        super();
        this.orderBooks = [new OrderBook("TATA", "INR")];
        this.user_balances = {
            "123": {
                TATA: {
                    available: 1000,
                    locked: 0,
                },
                INR: {
                    available: 1000,
                    locked: 0,
                },
            },
        };
        setInterval(() => {
            console.clear();
            console.log(JSON.stringify(this.order_books, null, 4));
        }, 5000);
    }
}
class Engine extends TEngine {
    process({ message, clientId, }) {
        const { payload: incomingOrder, type: messageType } = message;
        if (messageType == "CREATE_ORDER") {
            incomingOrder.price = Number(incomingOrder.price);
            incomingOrder.quantity = Number(incomingOrder.quantity);
            if (!this.order_books[incomingOrder.market])
                throw new Error("Market not found!");
            const order = Object.assign(Object.assign({}, incomingOrder), { orderId: Math.random().toString().slice(9), filled: 0 });
            this.checkAndLockAccount(order);
            const { fills, filledQty } = this.matchAndAddOrder(order);
            this.updateBalance(fills, order);
            const forUserInfo = {
                fills: fills.map(({ price, quantity, lastTradeId }) => ({
                    price,
                    quantity,
                    lastTradeId,
                })),
                filledQty,
                orderId: order.orderId,
            };
            this.createDbTrades(fills, market, userId);
            // this.updateDbOrders(order, executedQty, fills, market);
            // this.publisWsDepthUpdates(fills, price, side, market);
            // this.publishWsTrades(fills, userId, market);
            RedisManager_1.RedisManager.getInstance().sendToApi(clientId, {
                type: "ORDER_PLACED",
                payload: forUserInfo,
            });
        }
        if (messageType == "ORDER_CANCELLED") {
        }
    }
    checkAndLockAccount(order) {
        if (!this.user_balances[order.userId])
            throw new Error("add funds!");
        const base_asset = order.market.split("_")[0];
        const quote_asset = order.market.split("_")[1];
        if (order.side == "buy") {
            if (this.user_balances[order.userId][quote_asset].available >=
                Number(order.quantity) * Number(order.price)) {
                this.user_balances[order.userId][quote_asset].available =
                    this.user_balances[order.userId][quote_asset].available -
                        Number(order.quantity) * Number(order.price);
                this.user_balances[order.userId][quote_asset].locked =
                    this.user_balances[order.userId][quote_asset].locked +
                        Number(order.quantity) * Number(order.price);
            }
            else
                throw new Error("Insufficent funds!");
        }
        else {
            if (this.user_balances[order.userId][base_asset].available >=
                Number(order.quantity)) {
                this.user_balances[order.userId][base_asset].available =
                    this.user_balances[order.userId][base_asset].available -
                        Number(order.quantity);
                this.user_balances[order.userId][base_asset].locked =
                    this.user_balances[order.userId][base_asset].locked +
                        Number(order.quantity);
            }
            else
                throw new Error("Insufficent funds!");
        }
    }
    createDbTrades(fills) { }
    matchAndAddOrder(order) {
        let filledQty = 0;
        let fills = [];
        if (order.side == "buy") {
            // match bid
            while (this.order_books[order.market].asks.length && order.quantity) {
                const bestAsk = this.order_books[order.market].asks[0];
                if (bestAsk.price > order.price)
                    break;
                const minQty = Math.min(order.quantity, bestAsk.quantity);
                order.quantity -= minQty;
                order.filled += minQty;
                this.order_books[order.market].asks[0].filled += minQty;
                this.order_books[order.market].asks[0].quantity -= minQty;
                filledQty += minQty;
                fills.push({
                    otherUser: bestAsk.userId,
                    quantity: minQty,
                    price: bestAsk.price,
                    lastTradeId: this.order_books[order.market].lastTradeId++,
                    currentPrice: this.order_books[order.market].currentPrice,
                    timestamp: Date.now(),
                });
                //   append pending order
                if (this.order_books[order.market].asks[0].quantity == 0)
                    this.order_books[order.market].asks.shift();
            }
            if (order.quantity != 0) {
                this.order_books[order.market].bids.push(order);
                this.order_books[order.market].bids.sort((a, b) => b.price - a.price);
            }
        }
        else {
            // match ask
            while (this.order_books[order.market].bids.length && order.quantity) {
                const bestBid = this.order_books[order.market].bids[0];
                // someone is willing to sell at 200, but highest price at which other one is willing to buy is 100
                if (bestBid.price < order.price)
                    break;
                const minQty = Math.min(order.quantity, bestBid.quantity);
                order.quantity -= minQty;
                order.filled += minQty;
                this.order_books[order.market].bids[0].filled += minQty;
                this.order_books[order.market].bids[0].quantity -= minQty;
                filledQty += minQty;
                fills.push({
                    otherUser: bestBid.userId,
                    quantity: minQty,
                    price: order.price,
                    lastTradeId: this.order_books[order.market].lastTradeId++,
                    currentPrice: this.order_books[order.market].currentPrice,
                    timestamp: Date.now(),
                });
                if (this.order_books[order.market].bids[0].quantity == 0)
                    this.order_books[order.market].bids.shift();
            }
            //   append pending order
            if (order.quantity != 0) {
                this.order_books[order.market].asks.push(order);
                this.order_books[order.market].asks.sort((a, b) => a.price - b.price);
            }
        }
        return { fills, filledQty, pendingOrder: order };
    }
    updateBalance(fills, order) {
        const base_asset = order.market.split("_")[0];
        const quote_asset = order.market.split("_")[1];
        if (order.side == "buy") {
            fills.forEach((fill) => {
                // Giving him the money of which he just sold assets to buyer
                this.user_balances[fill.otherUser][quote_asset].available =
                    this.user_balances[fill.otherUser][quote_asset].available +
                        order.quantity * order.price;
                // crediting the asset he just bought
                this.user_balances[order.userId][base_asset].available =
                    this.user_balances[order.userId][base_asset].available +
                        order.quantity;
                // bcoz otherUser, base_asset/tata asset was locked at time, when he/she called for sale
                // now they got sold out so free them
                this.user_balances[fill.otherUser][base_asset].locked =
                    this.user_balances[fill.otherUser][base_asset].locked -
                        order.quantity * order.price;
                // When he call to buy asset, that relevent money was locked
                // Now he got that base asset equal to that locked amount
                // so free those locked doggies
                this.user_balances[order.userId][quote_asset].locked =
                    this.user_balances[order.userId][quote_asset].locked -
                        order.quantity * order.price;
            });
        }
        else {
            fills.forEach((fill) => {
                this.user_balances[fill.otherUser][quote_asset].locked =
                    this.user_balances[fill.otherUser][quote_asset].locked -
                        order.quantity;
                this.user_balances[order.userId][quote_asset].available =
                    this.user_balances[order.userId][quote_asset].available +
                        order.price * order.quantity;
                this.user_balances[fill.otherUser][base_asset].available =
                    this.user_balances[fill.otherUser][base_asset].available +
                        order.quantity;
                this.user_balances[order.userId][base_asset].locked =
                    this.user_balances[order.userId][base_asset].locked - order.quantity;
            });
        }
    }
}
exports.Engine = Engine;
