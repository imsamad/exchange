export type TAmount = number;
export type TTxn_id = string;
export type TPrice = number;
export type TQty = number;
export type TUserId = string;
export type TBase_Asset = string;
export type TQuote_Aasset = TBase_Asset;
export type TMarket_Str = string;
export type TSide = "sell" | "buy";
export type TTrade_id = number;
export type TOrde_Id = string;

export interface TFill {
  orderId: string;
  otherOrderId: string;

  userId: string;
  otherUserId: string;

  quantity: TQty;
  price: TPrice;

  tradeId: TTrade_id;
  timestamp: number;
}

export type IncomingOrder = {
  price: TPrice;
  quantity: TQty;
  side: TSide;
  userId: TUserId;
  market: TMarket_Str;
};

export type MessageToEngine =
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
      type: "CREATE_ORDER";
      payload: IncomingOrder;
    }
  | {
      type: "ORDER_CANCELLED";
      payload: {
        orderId: TOrde_Id;
        userId: TUserId;
        market: TMarket_Str;
      };
    }
  | {
      type: "ADD_ORDERBOOK";
      payload: {
        baseAsset: TBase_Asset;
        quoteAsset: TQuote_Aasset;
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
      type: "GET_DEPTH";
      payload: {
        market: TMarket_Str;
      };
    };

export interface TOrder extends IncomingOrder {
  orderId: TOrde_Id;
  filled: TQty;
}
export type TOrderBootType = {
  baseAsset: string;
  quoteAsset: string;
  lastTradeId?: number;
  currentPrice?: number;
  asks?: TOrder[];
  bids?: TOrder[];
};

export type TDepth = [TPrice, TQty][];

export type MessageFromEngien =
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
