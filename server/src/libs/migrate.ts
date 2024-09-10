require('dotenv').config();
import { Client } from 'pg';

/**
 * 1. Migrate users table, balances table
 * 2. markets table and related market_trade table
 * 3. add balances for all market
 */

export const migrateUserAndBalance = async (client: Client) => {
  try {
    const userSchema = `CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'user'))
        );`;

    await client.query(userSchema);

    await client.query(`    
        CREATE TABLE IF NOT EXISTS balances (
            balance_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_id),
            asset VARCHAR(50) NOT NULL,
            available NUMERIC NOT NULL,
            locked NUMERIC NOT NULL
        );    
    `);

    await client.query(`    
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
  } catch (error) {
    console.log('migrateUserAndBalance error: ', error);
    throw error;
  }
};

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
