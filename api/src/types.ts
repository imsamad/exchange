export type TPrice = number;
export type TQty = number;
export type TUserId = string;
export type TBase_Asset = string;
export type TQuote_Aasset = TBase_Asset;
export type TMarket_Str = string;
export type TSide = "sell" | "buy";

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

export interface TOrder {
  price: TPrice;
  quantity: TQty;
  side: TSide;
  userId: TUserId;
  market: TMarket_Str;

  filled: TQty;
  orderId: string;
}

export type IncomingOrder = {
  price: TPrice;
  quantity: TQty;
  side: TSide;
  userId: TUserId;
  market: TMarket_Str;
};

export interface TOrderBook {
  base_asset: TBase_Asset;
  quote_asset: TQuote_Aasset;
  asks: TOrder[];
  bids: TOrder[];
  currentPrice: number;
  depths: [TPrice, TQty][];
  lastTradeId: number;
}

export interface Balance {
  available: number;
  locked: number;
}

export type TUserBalance = Record<TQuote_Aasset | TBase_Asset, Balance>;

export interface TFill {
  otherUser: TUserId;
  quantity: TQty;
  price: TPrice;
  lastTradeId: number;
  currentPrice: number;
  timestamp: number;
}

export type MessageToEngine =
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
      type: "CREATE_ORDER";
      payload: IncomingOrder;
    };

export type MessageFromEngine =
  | {
      type: "ORDER_PLACED";
      payload: {
        orderId: string;
        filledQty: TQty;
        fills: Pick<TFill, "price" | "quantity" | "tradeId">[];
      };
    }
  | {
      type: "ONRAMPED";
      payload: {
        userId: string;
        amount: number;
      };
    };

export type MessageToStore = {
  type: "ONRAMP";
  payload: {
    userId: string;
    amount: number;
  };
};
