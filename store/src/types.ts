export type TPrice = number;
export type TQty = number;

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

export type DBMessage =
  | {
      type: "TRADE_ADDED";
      payload: {
        fill: TFill;
        market: string;
      };
    }
  | {
      type: "CREATE_TABLE";
      payload: {
        base_asset: string;
        quote_asset: string;
      };
    };
