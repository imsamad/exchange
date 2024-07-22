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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appInstance = void 0;
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const CustomError_1 = require("./libs/CustomError");
const ErrorHandler_1 = require("./middlewares/ErrorHandler");
const auth_1 = require("./middlewares/auth");
const createTable_1 = require("./libs/createTable");
const RedisManager_1 = require("./libs/RedisManager");
const PGManager_1 = require("./libs/PGManager");
const appInstance = (0, express_1.default)();
exports.appInstance = appInstance;
appInstance.use(express_1.default.json());
appInstance.use((0, cors_1.default)());
appInstance.use((0, morgan_1.default)("dev"));
appInstance.post("/limitorder", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const message = yield RedisManager_1.RedisManager.getInstance().sendAndWait({
        type: "CREATE_ORDER",
        payload: {
            price: req.body.price,
            quantity: req.body.quantity,
            market: req.body.market,
            userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id,
            side: req.body.side,
        },
    });
    res.json(message);
}));
appInstance.delete("/limitorder", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const message = yield RedisManager_1.RedisManager.getInstance().sendAndWait({
        type: "ORDER_CANCELLED",
        payload: {
            market: req.body.market,
            orderId: req.body.orderId,
            userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id,
        },
    });
    res.json(message.payload);
}));
appInstance.get("/depth", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield RedisManager_1.RedisManager.getInstance().sendAndWait({
        type: "GET_DEPTH",
        payload: {
            market: req.body.market,
        },
    });
    res.json(message.payload);
}));
appInstance.get("/openOrderBook", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const message = yield RedisManager_1.RedisManager.getInstance().sendAndWait({
        type: "OPEN_ORDERS",
        payload: {
            userId: (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id,
            market: req.body.market,
        },
    });
    res.json(message.payload);
}));
appInstance.post("/onramp", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
    const x = yield PGManager_1.PGManager.getInstance().getClient().query(`
    select * from markets;
  `);
    const base_assets_ = [
        ...new Set(x.rows.map(({ base_asset }) => base_asset)),
    ];
    const quote_assets_ = [
        ...new Set(x.rows.map(({ quote_asset }) => quote_asset)),
    ];
    const assets = [...new Set([...base_assets_, ...quote_assets_])];
    const promises = [];
    assets.forEach((asset) => {
        promises.push(new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const q = yield PGManager_1.PGManager.getInstance()
                    .getClient()
                    .query(`INSERT INTO "balances" (user_id, asset, available, locked) VALUES ($1, $2, $3, $4)  RETURNING *`, [userId, asset, 10000, 0]);
                const message = yield RedisManager_1.RedisManager.getInstance().sendAndWait({
                    type: "ON_RAMP",
                    payload: {
                        userId: userId,
                        amount: 10000,
                        txnId: q.rows[0].balance_id,
                        asset,
                    },
                });
                resolve(message);
            }
            catch (error) {
                reject(error);
            }
        })));
    });
    const result = yield Promise.allSettled(promises);
    res.json({ message: "ok", result: result });
}));
appInstance.get("/markets", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const q = yield PGManager_1.PGManager.getInstance().getClient().query(`
      select * from markets;
    `);
    res.json({
        markets: q.rows,
    });
}));
appInstance.post("/markets", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, createTable_1.createTables)(PGManager_1.PGManager.getInstance().getClient(), req.body.base_asset, req.body.quote_asset);
    const mes = yield RedisManager_1.RedisManager.getInstance().sendAndWait({
        type: "ADD_ORDERBOOK",
        payload: {
            baseAsset: req.body.base_asset,
            quoteAsset: req.body.quote_asset,
        },
    });
    res.json(mes.payload);
}));
appInstance.use(() => {
    throw new CustomError_1.CustomeError(404, "Not Found!");
});
appInstance.use(ErrorHandler_1.ErrorHandler);
