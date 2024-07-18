type TPrice = number;
type TQty = number;
type TUserId = string;
type TMarket_Str = string;
type TSide = "ask" | "bid";

export type TIncomingOrder = {
  price: TPrice;
  quantity: TQty;
  side: TSide;
  userId: TUserId;
  market: TMarket_Str;
};
