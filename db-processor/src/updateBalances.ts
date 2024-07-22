import { DBMessage } from "./types";
import { Client } from "pg";

export const updateBalance = async (message: DBMessage, pgClient: Client) => {
  if (message.type != "BALANCE_UPDATES") return;
  const updates: any = [];
  const values: any = [];

  message.payload.updatedBalances.forEach((payload, index) => {
    const { userId, asset, balance } = payload;
    updates.push(
      `($${index * 4 + 1}::INTEGER, $${index * 4 + 2}::TEXT, $${
        index * 4 + 3
      }::DOUBLE PRECISION, $${index * 4 + 4}::DOUBLE PRECISION)`
    );

    values.push(userId, asset, balance.available, balance.locked);
  });

  const query = `
      UPDATE balances AS b
      SET 
        available = u.available,
        locked = u.locked
      FROM (
        VALUES
          ${updates.join(", ")}
      ) AS u(user_id, asset, available, locked)
      WHERE b.user_id = u.user_id
        AND b.asset = u.asset;
    `;

  try {
    const res = await pgClient.query(query, values);
    console.log("updated user balance table!");
  } catch (err) {
    console.log("err while updating balances: ", err);
  }
};
