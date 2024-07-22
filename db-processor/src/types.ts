export type TPrice = number;
export type TQty = number;
export type TBase_Asset = string;
export type TQuote_Aasset = TBase_Asset;
export type TUserId = string;
export type TAmount = number;
export type TMarket_Str = string;
export type TSide = "ask" | "bid";
export type TOrde_Id = string;
export type TTrade_id = number;
export type TTxn_id = string;

export interface Balance {
  available: TPrice;
  locked: TPrice;
}

export interface TFill {
  orderId: string;
  otherOrderId: string;

  userId: string;
  otherUserId: string;

  quantity: TQty;
  price: TPrice;

  side: TSide;

  tradeId: number;
  timestamp: number;
}

export type DBMessage =
  | {
      type: "TRADE_ADDED";
      payload: {
        fills: TFill[];
        market: TMarket_Str;
      };
    }
  | {
      type: "BALANCE_UPDATES";
      payload: {
        updatedBalances: {
          userId: TUserId;
          asset: TBase_Asset | TQuote_Aasset;
          balance: Balance;
        }[];
      };
    };
