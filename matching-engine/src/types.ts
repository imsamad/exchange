export type TPrice = number;
export type TAmount = number;
export type TQty = number;
export type TUserId = string;
export type TBase_Asset = string;
export type TQuote_Aasset = TBase_Asset;
export type TMarket_Str = string;
export type TSide = "ask" | "bid";
export type TOrde_Id = string;
export type TTrade_id = number;
export type TTxn_id = string;

export type TOrderBootType = {
  baseAsset: string;
  quoteAsset: string;
  lastTradeId?: number;
  currentPrice?: number;
  asks?: TOrder[];
  bids?: TOrder[];
};

export type IncomingOrder = {
  price: TPrice;
  quantity: TQty;
  side: TSide;
  userId: TUserId;
  market: TMarket_Str;
};

export interface TOrder extends IncomingOrder {
  orderId: TOrde_Id;
  filled: TQty;
}

export interface TFill {
  orderId: TOrde_Id;
  otherOrderId: TOrde_Id;

  userId: TUserId;
  otherUserId: TUserId;

  quantity: TQty;
  price: TPrice;

  tradeId: TTrade_id;
  timestamp: number;

  side: TSide;

  // TODO: is it not extra?
  market: TMarket_Str;
}

export interface Balance {
  available: TPrice;
  locked: TPrice;
}

export type TUserBalance = Record<TQuote_Aasset | TBase_Asset, Balance>;

export type DBMessage =
  | {
      type: "BALANCE_UPDATES";
      payload: {
        updatedBalances: {
          userId: TUserId;
          asset: TBase_Asset | TQuote_Aasset;
          balance: Balance;
        }[];
      };
    }
  | {
      type: "TRADE_ADDED";
      payload: {
        fills: TFill[];
        market: TMarket_Str;
      };
    };

export type MessageToApi =
  | {
      type: "ORDER_PLACED";
      payload: {
        orderId: TOrde_Id;
        filledQty: TQty;
        fills: Pick<TFill, "price" | "quantity" | "tradeId">[];
      };
    }
  | {
      type: "ORDER_CANCELLED";
      payload: {
        message: "success" | "error";
      };
    }
  | {
      type: "DEPTH";
      payload: {
        bids: TDepth;
        asks: TDepth;
        currentPrice: TOrderBootType["currentPrice"];
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
        message: "success" | "error";
      };
    }
  | {
      type: "ON_RAMP";
      payload: {
        error: boolean;
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
        userId: TUserId;
        amount: TAmount;
        txnId: TTxn_id;
        asset: TBase_Asset;
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
    updatedAsks?: TDepth;
    updatedBids?: TDepth;
    type: "depth";
  };
};

export type TradeAddedMessage = {
  stream: string;
  data: {
    type: "trade";
    tradeId: number;
    m: boolean;
    price: TPrice;
    quantity: TQty;
    symbol: string; // symbol
  };
};

export type WsMessage = DepthUpdateMessage | TradeAddedMessage;
