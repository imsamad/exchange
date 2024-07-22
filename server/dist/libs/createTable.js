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
exports.createTables = void 0;
const createTables = (client, base_asset, quote_asset) => __awaiter(void 0, void 0, void 0, function* () {
    const table_name = `${base_asset}_${quote_asset}`.toLowerCase();
    yield client.query(`INSERT INTO markets ( base_asset,quote_asset) 
      VALUES ($1, $2);`, [base_asset.toLowerCase(), quote_asset.toLowerCase()]);
    yield client.query(`
            CREATE TABLE IF NOT EXISTS ${table_name} (
                time              TIMESTAMP WITH TIME ZONE NOT NULL,
                price             DOUBLE PRECISION,
                volume            DOUBLE PRECISION,
                trade_id          INTEGER NOT NULL,
                currency_code     VARCHAR(10),
                user_id           INTEGER NOT NULL REFERENCES users(user_id),
                other_user_id     INTEGER NOT NULL REFERENCES users(user_id),
                side VARCHAR(3)   NOT NULL CHECK (side IN ('ask', 'bid'))
            );
  
            SELECT create_hypertable('${table_name}', 'time', 'price', 2);
        `);
    yield client.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS ${table_name}_klines_1m AS
            SELECT
                time_bucket('1 minute', time) AS bucket,
                first(price, time) AS open,
                max(price) AS high,
                min(price) AS low,
                last(price, time) AS close,
                sum(volume) AS volume,
                currency_code
            FROM ${table_name}
            GROUP BY bucket, currency_code;
        `);
    yield client.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS ${table_name}_klines_1h AS
            SELECT
                time_bucket('1 hour', time) AS bucket,
                first(price, time) AS open,
                max(price) AS high,
                min(price) AS low,
                last(price, time) AS close,
                sum(volume) AS volume,
                currency_code
            FROM ${table_name}
            GROUP BY bucket, currency_code;
        `);
    yield client.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS ${table_name}_klines_1w AS
            SELECT
                time_bucket('1 week', time) AS bucket,
                first(price, time) AS open,
                max(price) AS high,
                min(price) AS low,
                last(price, time) AS close,
                sum(volume) AS volume,
                currency_code
            FROM ${table_name}
            GROUP BY bucket, currency_code;
        `);
});
exports.createTables = createTables;
