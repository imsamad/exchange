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
require("dotenv").config();
const redis_1 = require("redis");
const connect_pg_1 = require("./connect-pg");
const updateBalances_1 = require("./updateBalances");
const tradeAdded_1 = require("./tradeAdded");
(0, connect_pg_1.connectPgWithRetry)().then((pgClient) => __awaiter(void 0, void 0, void 0, function* () {
    if (!pgClient)
        return;
    console.log("): pg connected!");
    try {
        const redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL,
        });
        yield redisClient.connect();
        console.log("): connected to redis");
        console.log("): store running!");
        while (true) {
            const response = yield redisClient.brPop("db_processor", 0);
            if (!response)
                continue;
            const message = JSON.parse(response.element);
            console.log("processing: ", message);
            if (message.type == "BALANCE_UPDATES") {
                yield (0, updateBalances_1.updateBalance)(message, pgClient);
            }
            else if (message.type == "TRADE_ADDED") {
                yield (0, tradeAdded_1.tradeAdded)(message, pgClient);
            }
        }
    }
    catch (error) {
        console.error("error from: ", error);
        process.exit();
    }
}));
