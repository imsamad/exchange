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
exports.tradeAdded = void 0;
const tradeAdded = (message, pgClient) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.type != "TRADE_ADDED")
        return;
    try {
        if (!message.payload.fills.length)
            return;
        const placeholders = message.payload.fills
            .map((_, index) => `($${index * 7 + 1},$${index * 7 + 2},$${index * 7 + 3},$${index * 7 + 4},$${index * 7 + 5},$${index * 7 + 6},$${index * 7 + 7})`)
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
        const res = yield pgClient.query(q, values);
    }
    catch (err) {
        console.error(`Error while updating ${message.payload.market} table query`, err.stack);
    }
});
exports.tradeAdded = tradeAdded;
