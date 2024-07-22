"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBalance = void 0;
const updateBalance = (message, pgClient) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.type != "BALANCE_UPDATES")
        return;
    const updates = [];
    const values = [];
    message.payload.updatedBalances.forEach((payload, index) => {
        const { userId, asset, balance } = payload;
        updates.push(`($${index * 4 + 1}::INTEGER, $${index * 4 + 2}::TEXT, $${index * 4 + 3}::DOUBLE PRECISION, $${index * 4 + 4}::DOUBLE PRECISION)`);
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
        const res = yield pgClient.query(query, values);
        console.log("updated user balance table!");
    }
    catch (err) {
        console.log("err while updating balances: ", err);
    }
});
exports.updateBalance = updateBalance;
