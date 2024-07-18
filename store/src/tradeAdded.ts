import { DBMessage } from "./types";
import { Client } from "pg";

export const tradeAdded = async (message: DBMessage, pgClient: Client) => {
  if (message.type != "TRADE_ADDED") return;

  try {
    if (!message.payload.fills.length) return;

    const placeholders = message.payload.fills
      .map(
        (_, index) =>
          `($${index * 7 + 1},$${index * 7 + 2},$${index * 7 + 3},$${
            index * 7 + 4
          },$${index * 7 + 5},$${index * 7 + 6},$${index * 7 + 7})`
      )
      .join(", ");

    const q = `INSERT INTO ${message.payload.market} (price,volume,trade_id,user_id,other_user_id,side,time)
        VALUES ${placeholders}; 
      `;
    const values = message.payload.fills
      .map((fill) => [
        fill.price,
        fill.quantity,
        fill.tradeId,
        fill.userId,
        fill.otherUserId,
        fill.side,
        new Date(fill.timestamp),
      ])
      .flat();

    const res = await pgClient.query(q, values);
  } catch (err: any) {
    console.error(
      `Error while updating ${message.payload.market} table query`,
      err.stack
    );
  }
};
