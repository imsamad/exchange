import { TFill, TOrder, TPrice } from "./types";

type OrderBootType = {
  baseAsset: string;
  quoteAsset: string;
  lastTradeId?: number;
  currentPrice?: number;
  asks?: TOrder[];
  bids?: TOrder[];
};

export abstract class TOrderBook {
  public baseAsset: string;
  public quoteAsset: string;
  public lastTradeId: number;
  public currentPrice: number;
  public ticker: string;
  public asks: TOrder[];
  public bids: TOrder[];

  getSnapShot(): OrderBootType {
    return {
      baseAsset: this.baseAsset,
      quoteAsset: this.quoteAsset,
      lastTradeId: this.lastTradeId,
      currentPrice: this.currentPrice,
      asks: this.asks,
      bids: this.bids,
    };
  }

  public depth: any;

  static getTicker(baseAsset: string, quoteAsset: string) {
    return `${baseAsset}_${quoteAsset}`;
  }
  constructor({
    baseAsset,
    quoteAsset,
    lastTradeId = 0,
    currentPrice = 0,
    asks = [],
    bids = [],
  }: OrderBootType) {
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    this.ticker = OrderBook.getTicker(baseAsset, quoteAsset);
    this.lastTradeId = lastTradeId;
    this.currentPrice = currentPrice;
    this.asks = asks;
    this.bids = bids;
  }

  public abstract addOrder(order: TOrder): {
    filledQty: number;
    fills: TFill[];
  };

  public abstract matchAsk(order: TOrder): {
    fills: TFill[];
    remainingOrder: TOrder;
  };

  public abstract matchBid(order: TOrder): {
    fills: TFill[];
    remainingOrder: TOrder;
  };

  public abstract cancelAsk(orderId: string): TPrice;

  public abstract cancelBid(orderId: string): TPrice;

  public abstract getOpenOrders(userId: string): {
    bids: TOrder[];
    asks: TOrder[];
  };

  public abstract getDepth(): {
    asks: [number, number][];
    bids: [number, number][];
    currentPrice: number;
  };
}

export class OrderBook extends TOrderBook {
  public addOrder(order: TOrder): {
    fills: TFill[];
    filledQty: number;
  } {
    if (order.side == "buy") {
      const { fills, remainingOrder } = this.matchBid(order);

      if (remainingOrder.quantity != remainingOrder.filled) {
        this.bids.push(remainingOrder);
        this.bids = this.bids.sort((a, b) => b.price - a.price);
      }

      return {
        fills,
        filledQty: remainingOrder.filled,
      };
    } else {
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

  public matchBid(_order: TOrder): {
    fills: TFill[];
    remainingOrder: TOrder;
  } {
    const order = _order;

    const fills: TFill[] = [];

    const bestAsk = this.asks[0];

    while (
      bestAsk &&
      bestAsk.price <= order.price &&
      order.quantity - order.filled > 0
    ) {
      const minFillableQty = Math.min(
        order.quantity - order.filled,
        bestAsk.quantity - bestAsk.filled
      );

      order.filled += minFillableQty;

      this.asks[0].filled += minFillableQty;

      fills.push({
        orderId: order.orderId,
        otherOrderId: bestAsk.orderId,

        userId: order.userId,
        otherUserId: bestAsk.userId,

        quantity: minFillableQty,

        price: bestAsk.price,

        tradeId: this.lastTradeId++,
        timestamp: Date.now(),
      });

      if (this.asks[0].filled == this.asks[0].quantity) this.asks.shift();
    }

    return {
      fills,
      remainingOrder: order,
    };
  }

  public matchAsk(_order: TOrder): {
    fills: TFill[];
    remainingOrder: TOrder;
  } {
    const order = _order;

    const fills: TFill[] = [];

    const bestBid = this.bids[0];

    while (
      bestBid &&
      bestBid.price >= order.price &&
      order.quantity - order.filled > 0
    ) {
      const minFillableQty = Math.min(
        order.quantity - order.filled,
        bestBid.quantity - bestBid.filled
      );

      order.filled += minFillableQty;
      this.bids[0].filled += minFillableQty;
      this.currentPrice = bestBid.price;
      fills.push({
        orderId: order.orderId,
        otherOrderId: bestBid.orderId,

        userId: order.userId,
        otherUserId: bestBid.userId,

        quantity: minFillableQty,

        price: bestBid.price,

        tradeId: this.lastTradeId++,

        timestamp: Date.now(),
      });

      if (this.bids[0].quantity == this.bids[0].filled) this.bids.shift();
    }

    return {
      fills,
      remainingOrder: order,
    };
  }

  public cancelAsk(_orderId: string): TPrice {
    let cancelledAskPrice = 0;
    this.asks = this.asks.filter(({ orderId, price }) => {
      if (orderId != _orderId) return true;
      cancelledAskPrice = price;
      return false;
    });

    return cancelledAskPrice;
  }

  public cancelBid(_orderId: string): TPrice {
    let cancelledBidPrice = 0;
    this.bids = this.bids.filter(({ orderId, price }) => {
      if (orderId != _orderId) return true;
      cancelledBidPrice = price;
      return false;
    });

    return cancelledBidPrice;
  }

  public getOpenOrders(userId: string): { bids: TOrder[]; asks: TOrder[] } {
    return {
      bids: this.bids.filter((order) => order.userId == userId),
      asks: this.asks.filter((order) => order.userId == userId),
    };
  }

  public getDepth(): {
    bids: [number, number][];
    asks: [number, number][];
    currentPrice: number;
  } {
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
