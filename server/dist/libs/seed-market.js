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
exports.base_assets = exports.quote_assets = void 0;
require("dotenv").config();
const redis_1 = require("redis");
const pg_1 = require("pg");
const createTable_1 = require("./createTable");
const migrate_1 = require("./migrate");
/**
 * 1. Migrate users table, balances table
 * 2. markets table and related market_trade table
 * 3. add balances for all market
 */
// @ts-ignore
const redisClient = (0, redis_1.createClient)(process.env.REDIS_URL);
const pgClient = new pg_1.Client(process.env.DATABASE_URL);
pgClient
    .connect()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.connect();
    yield (0, migrate_1.migrateUserAndBalance)(pgClient);
    let promised = [];
    for (let i = 0; i < 1; i++) {
        promised.push(new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const res = yield (0, createTable_1.createTables)(pgClient, exports.base_assets[i], exports.quote_assets[i]);
                console.log("first");
                console.log(res);
                const clientId = Math.random().toString().slice(2, 10) +
                    Math.random().toString().slice(2, 10);
                redisClient.lPush("messages", JSON.stringify({
                    clientId,
                    message: {
                        baseAsset: exports.base_assets[i],
                        quoteAsset: exports.quote_assets[i],
                    },
                }));
                resolve(true);
            }
            catch (error) {
                console.log(error);
                reject(false);
            }
        })));
    }
    console.log(promised.length);
    yield Promise.allSettled(promised)
        .then((res) => {
        console.log(res);
    })
        .catch((err) => {
        console.log(err);
    })
        .finally(() => {
        console.log("finally");
        process.exit();
    });
}))
    .catch((err) => {
    console.log("err: ", err);
})
    .finally(() => {
    console.log("finally from outer branch");
    process.exit();
});
exports.quote_assets = [
    "USDT",
    "USDC",
    "EUR",
    "JPY",
    "GBP",
    "AUD",
    "CAD",
    "CHF",
    "CNY",
    "KRW",
    "INR",
    "BRL",
    "RUB",
    "MXN",
    "ZAR",
    "SGD",
    "HKD",
    "NZD",
    "NOK",
    "SEK",
    "DKK",
    "PLN",
    "TRY",
    "AED",
    "SAR",
    "TWD",
    "THB",
    "IDR",
    "VND",
    "MYR",
    "PHP",
    "CZK",
    "HUF",
    "RON",
    "BGN",
    "HRK",
    "ISK",
    "UAH",
    "GEL",
    "KZT",
    "AMD",
    "AZN",
    "BYN",
    "KGS",
    "MDL",
    "MKD",
    "RSD",
    "ALL",
    "BAM",
    "JOD",
    "ILS",
    "EGP",
    "LBP",
    "MAD",
    "DZD",
    "TND",
    "LYD",
    "SYP",
    "IQD",
    "YER",
    "OMR",
    "QAR",
    "BHD",
    "KWD",
    "MZN",
    "ANG",
    "AWG",
    "BBD",
    "BSD",
    "BZD",
    "BTN",
    "CLP",
    "COP",
    "CRC",
    "CUP",
    "DOP",
    "EEK",
    "FJD",
    "GYD",
    "HTG",
    "JMD",
    "KPW",
    "LAK",
    "LRD",
    "MNT",
    "NAD",
    "NGN",
    "PAB",
    "PEN",
    "PGK",
    "PYG",
    "SBD",
    "SLL",
    "SRD",
    "SZL",
    "TOP",
    "TTD",
    "UZS",
    "WST",
    "XOF",
];
exports.base_assets = [
    "BTC",
    "ETH",
    "XRP",
    "LTC",
    "BCH",
    "EOS",
    "XLM",
    "ADA",
    "TRX",
    "DASH",
    "XMR",
    "MIOTA",
    "NEO",
    "ETC",
    "XEM",
    "ZEC",
    "QTUM",
    "LSK",
    "OMG",
    "BTG",
    "DCR",
    "VET",
    "MKR",
    "ZRX",
    "DOGE",
    "BAT",
    "ICX",
    "REP",
    "GNT",
    "SNT",
    "BNT",
    "KNC",
    "CVC",
    "REN",
    "LRC",
    "SNX",
    "ANT",
    "QSP",
    "STORJ",
    "MANA",
    "MTL",
    "FUN",
    "RLC",
    "POWR",
    "DNT",
    "STMX",
    "KAVA",
    "BAND",
    "BAL",
    "COMP",
    "CRV",
    "YFI",
    "SRM",
    "FTT",
    "UNI",
    "AAVE",
    "ALGO",
    "FIL",
    "GRT",
    "RUNE",
    "AVAX",
    "SUSHI",
    "SOL",
    "CAKE",
    "LUNA",
    "FTM",
    "MATIC",
    "HNT",
    "KSM",
    "MINA",
    "RAY",
    "AUDIO",
    "SAND",
    "CHZ",
    "ENS",
    "AXS",
    "DYDX",
    "GALA",
    "RGT",
    "IMX",
    "ILV",
    "YGG",
    "FLOW",
    "CELO",
    "AR",
    "ROSE",
    "MOVR",
    "GNO",
    "SUPER",
    "RARI",
    "UOS",
    "LPT",
    "MPL",
    "KP3R",
    "OGN",
    "UMA",
    "TRB",
    "POLY",
    "FET",
    "CTK",
];
