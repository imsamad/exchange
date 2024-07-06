export type price = number;
export type qty = number;
export type TUserId = string;
export type TBase_Asset = string;
export type TQuote_Aasset = TBase_Asset;
export type TMarket_Str = string;
export type TSide = "sell" | "buy";

export interface TOrder {
  price: price;
  quantity: qty;
  side: TSide;
  userId: TUserId;
  market: TMarket_Str;

  filled: qty;
  orderId: string;
}

export type IncomingOrder = {
  price: price;
  quantity: qty;
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
  depths: [price, qty][];
  lastTradeId: number;
}

export interface Balance {
  available: number;
  locked: number;
}

export type TUserBalance = Record<TQuote_Aasset | TBase_Asset, Balance>;

export interface TFill {
  otherUser: TUserId;
  quantity: number;
  price: number;
  lastTradeId: number;
  currentPrice: number;
  timestamp: number;
}

export type MessageToApi =
  | {
      type: "ORDER_PLACED";
      payload: {
        orderId: string;
        filledQty: number;
        fills: Pick<TFill, "price" | "quantity" | "lastTradeId">[];
      };
    }
  | {
      type: "CREATE_ORDER";
      payload: {
        price: price;
        quantity: qty;
        side: TSide;
        userId: TUserId;
        market: TMarket_Str;
      };
    };
