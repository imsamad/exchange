require("dotenv").config();
import axios from "axios";
import { Client } from "pg";
import { base_assets, quote_assets } from "./seeder";
import { createClient, RedisClientType } from "redis";

/**
 * 1. Migrate users table, balances table
 * 2. markets table and related market_trade table
 * 3. add balances for all market
 */

const pgClient = new Client(process.env.DATABASE_URL);

pgClient
  .connect()
  .then(async () => {
    let promised: any = [];
    for (let i = 0; i < 1; i++) {
      promised.push(
        axios.post("http://localhost:4000/markets", {
          base_asset: [...new Set(base_assets)][i],
          quote_asset: "inr",
        })
      );
    }

    Promise.allSettled(promised)
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
  })
  .catch((err) => {
    console.log("err: ", err);
  });
