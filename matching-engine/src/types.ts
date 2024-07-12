import { TOrderBook } from "./OrderBook";

export type TPrice = number;
export type TQty = number;
export type TUserId = string;
export type TBase_Asset = string;
export type TQuote_Aasset = TBase_Asset;
export type TMarket_Str = string;
export type TSide = "sell" | "buy";

export interface TOrder {
  orderId: string;
  userId: TUserId;
  price: TPrice;
  quantity: TQty;
  side: TSide;
  market: TMarket_Str;
  filled: TQty;
}

export type IncomingOrder = {
  price: TPrice;
  quantity: TQty;
  side: TSide;
  userId: TUserId;
  market: TMarket_Str;
};

export interface TFill {
  orderId: string;
  otherOrderId: string;

  userId: string;
  otherUserId: string;

  quantity: TQty;
  price: TPrice;

  tradeId: number;
  timestamp: number;
}

export interface Balance {
  available: number | TPrice;
  locked: number | TPrice;
}

export type TUserBalance = Record<TQuote_Aasset | TBase_Asset, Balance>;

export type DBMessage = {
  type: "TRADE_ADDED";
  payload: {
    fill: TFill;
    market: TMarket_Str;
  };
};

export type MessageToApi =
  | {
      type: "ORDER_PLACED";
      payload: {
        orderId: string;
        filledQty: TQty;
        fills: Pick<TFill, "price" | "quantity" | "tradeId">[];
      };
    }
  | {
      type: "DEPTH";
      payload: {
        bids: TDepth;
        asks: TDepth;
        currentPrice: TOrderBook["currentPrice"];
      };
    }
  | {
      type: "OPEN_ORDERS";
      payload: {
        bids: TOrder[];
        asks: TOrder[];
      };
    }
  | {
      type: "ADDED_ORDERBOOK";
      payload: {
        message: "success";
      };
    };

export type TDepth = [TPrice, TQty][];
export type MessageFromApi =
  | {
      type: "CREATE_ORDER";
      payload: IncomingOrder;
    }
  | {
      type: "ORDER_CANCELLED";
      payload: {
        orderId: TOrder["orderId"];
        userId: TUserId;
        market: TMarket_Str;
      };
    }
  | {
      type: "ON_RAMP";
      payload: {
        userId: string;
        amount: number;
        txnId: string;
        quoteAsset: TBase_Asset;
      };
    }
  | {
      type: "GET_DEPTH";
      payload: {
        market: TMarket_Str;
      };
    }
  | {
      type: "OPEN_ORDERS";
      payload: {
        userId: string;
        market: TMarket_Str;
      };
    }
  | {
      type: "ADD_ORDERBOOK";
      payload: {
        baseAsset: TBase_Asset;
        quoteAsset: TQuote_Aasset;
      };
    };

export type DepthUpdateMessage = {
  stream: string;
  data: {
    b?: TDepth;
    a?: TDepth;
    e: "depth";
  };
};

export type TradeAddedMessage = {
  stream: string;
  data: {
    e: "trade";
    t: number;
    m: boolean;
    p: TPrice;
    q: TQty;
    s: string; // symbol
  };
};

export type WsMessage = DepthUpdateMessage | TradeAddedMessage;
