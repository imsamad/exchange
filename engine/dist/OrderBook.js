"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBook = exports.TOrderBook = void 0;
function removeElementAtIndex(arr, index) {
    if (index > -1 && index < arr.length) {
        arr.splice(index, 1);
    }
    return arr;
}
class TOrderBook {
    getSnapShot() {
        return {
            baseAsset: this.baseAsset,
            quoteAsset: this.quoteAsset,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice,
            asks: this.asks,
            bids: this.bids,
        };
    }
    static getTicker(baseAsset, quoteAsset) {
        return `${baseAsset.toLowerCase()}_${quoteAsset.toLowerCase()}`;
    }
    constructor({ baseAsset, quoteAsset, lastTradeId = 0, currentPrice = 0, asks = [], bids = [], }) {
        this.baseAsset = baseAsset;
        this.quoteAsset = quoteAsset;
        this.ticker = OrderBook.getTicker(baseAsset, quoteAsset);
        this.lastTradeId = lastTradeId;
        this.currentPrice = currentPrice;
        this.asks = asks;
        this.bids = bids;
    }
}
exports.TOrderBook = TOrderBook;
class OrderBook extends TOrderBook {
    addOrder(order) {
        if (order.side == "bid") {
            const { fills, remainingOrder } = this.matchBid(order);
            if (remainingOrder.quantity != remainingOrder.filled) {
                this.bids.push(remainingOrder);
                this.bids = this.bids.sort((a, b) => b.price - a.price);
            }
            return {
                fills,
                filledQty: remainingOrder.filled,
            };
        }
        else {
            const { fills, remainingOrder } = this.matchAsk(order);
            if (remainingOrder.quantity != remainingOrder.filled) {
                this.asks.push(remainingOrder);
                this.asks = this.asks.sort((a, b) => a.price - b.price);
            }
            return {
                fills,
                filledQty: remainingOrder.filled,
            };
        }
    }
    matchBid(_order) {
        const order = _order;
        const fills = [];
        // if asks are not empty
        // if there any order on asks side willing to sell at price lower or equal then the
        // current user price
        let i = 0;
        /**
         * bidPrice - 20
         * asks : [40,50,60,70,80]
         *
         */
        while (i < this.asks.length && order.quantity - order.filled > 0) {
            const bestAsk = this.asks[i];
            if (order.userId == bestAsk.userId || order.price < bestAsk.price) {
                i++;
                continue;
            }
            const minFillableQty = Math.min(order.quantity - order.filled, bestAsk.quantity - bestAsk.filled);
            this.currentPrice = bestAsk.price;
            order.filled += minFillableQty;
            this.asks[i].filled += minFillableQty;
            fills.push({
                orderId: order.orderId,
                otherOrderId: bestAsk.orderId,
                userId: order.userId,
                otherUserId: bestAsk.userId,
                quantity: minFillableQty,
                price: bestAsk.price,
                tradeId: this.lastTradeId++,
                timestamp: Date.now(),
                market: order.market,
                side: "bid",
            });
            if (this.asks[i].filled == this.asks[i].quantity) {
                this.asks = removeElementAtIndex(this.asks, i);
            }
            else
                i++;
        }
        return {
            fills,
            remainingOrder: order,
        };
    }
    matchAsk(_order) {
        const saleOrder = _order;
        const fills = [];
        let i = 0;
        /**
         * askPrice - 120
         * bids : [100, 80, 60, 40]
         *
         */
        while (i < this.bids.length && saleOrder.quantity != saleOrder.filled) {
            const bestBid = this.bids[i];
            if (bestBid.userId == saleOrder.userId ||
                saleOrder.price > bestBid.price) {
                i++;
                continue;
            }
            const minFillableQty = Math.min(saleOrder.quantity - saleOrder.filled, bestBid.quantity - bestBid.filled);
            saleOrder.filled += minFillableQty;
            this.bids[i].filled += minFillableQty;
            this.currentPrice = bestBid.price;
            fills.push({
                orderId: saleOrder.orderId,
                otherOrderId: bestBid.orderId,
                userId: saleOrder.userId,
                otherUserId: bestBid.userId,
                quantity: minFillableQty,
                price: bestBid.price,
                tradeId: this.lastTradeId++,
                timestamp: Date.now(),
                market: saleOrder.market,
                side: "bid",
            });
            if (this.bids[i].quantity == this.bids[i].filled) {
                this.bids = removeElementAtIndex(this.bids, i);
            }
            else
                i++;
        }
        return {
            fills,
            remainingOrder: saleOrder,
        };
    }
    cancelAsk(_orderId) {
        let cancelledAskPrice = 0;
        this.asks = this.asks.filter(({ orderId, price }) => {
            if (orderId != _orderId)
                return true;
            cancelledAskPrice = price;
            return false;
        });
        return cancelledAskPrice;
    }
    cancelBid(_orderId) {
        let cancelledBidPrice = 0;
        this.bids = this.bids.filter(({ orderId, price }) => {
            if (orderId != _orderId)
                return true;
            cancelledBidPrice = price;
            return false;
        });
        return cancelledBidPrice;
    }
    getOpenOrders(userId) {
        return {
            bids: this.bids.filter((order) => order.userId == userId),
            asks: this.asks.filter((order) => order.userId == userId),
        };
    }
    getDepth() {
        const bidsMap = new Map();
        this.bids.forEach(({ price, quantity }) => {
            bidsMap.set(price, bidsMap.get(price) || 0 + quantity);
        });
        const asksMap = new Map();
        this.asks.forEach(({ price, quantity }) => {
            asksMap.set(price, asksMap.get(price) || 0 + quantity);
        });
        return {
            bids: [...bidsMap.entries()],
            asks: [...asksMap.entries()],
            currentPrice: this.currentPrice,
        };
    }
}
exports.OrderBook = OrderBook;
