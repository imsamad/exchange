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
exports.migrateUserAndBalance = void 0;
require("dotenv").config();
/**
 * 1. Migrate users table, balances table
 * 2. markets table and related market_trade table
 * 3. add balances for all market
 */
const migrateUserAndBalance = (client) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userSchema = `CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'user'))
        );`;
        yield client.query(userSchema);
        yield client.query(`    
        CREATE TABLE IF NOT EXISTS balances (
            balance_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_id),
            asset VARCHAR(50) NOT NULL,
            available NUMERIC NOT NULL,
            locked NUMERIC NOT NULL
        );    
    `);
        yield client.query(`    
        CREATE TABLE IF NOT EXISTS markets (
            market_id SERIAL PRIMARY KEY,
            quote_asset VARCHAR(50),
            base_asset VARCHAR(50) NOT NULL UNIQUE
        );    
    `);
        //   await client.query(`
        //     CREATE TABLE IF NOT EXISTS order (
        //         order_id SERIAL PRIMARY KEY,
        //         market VARCHAR(50),
        //         side CHECK(side IN ('ask', 'bid')) NOT NULL,
        //         price NUMERIC NOT NULL,
        //         quantity NUMERIC NOT NULL,
        //         user_id INT NOT NULL REFERENCES users(user_id),
        //     );
        // `);
    }
    catch (error) {
        console.log("migrateUserAndBalance error: ", error);
        throw error;
    }
});
exports.migrateUserAndBalance = migrateUserAndBalance;
// const pgClient = new Client(process.env.DATABASE_URL);
// pgClient
//   .connect()
//   .then(async () => {
//     await migrateUserAndBalance(pgClient);
//   })
//   .catch((err) => {
//     console.log(err);
//   })
//   .finally(() => {
//     process.exit();
//   });
