import { Client } from "pg";

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
  } catch (error) {
    console.log("migrateUserAndBalance error: ", error);
    throw error;
  }
};

export const createTables = async (
  client: Client,
  base_asset: string,
  quote_asset: string
) => {
  const table_name = `${base_asset}_${quote_asset}`.toLowerCase();

  await client.query(`
          CREATE TABLE IF NOT EXISTS "${table_name}" (
              time              TIMESTAMP WITH TIME ZONE NOT NULL,
              price             DOUBLE PRECISION,
              volume            DOUBLE PRECISION,
              trade_id          INTEGER NOT NULL,
              currency_code     VARCHAR (10)
              user_id           INTEGER NOT NULL REFERENCES users(user_id),
              other_user_id     INTEGER NOT NULL REFERENCES users(user_id),
              side VARCHAR(3)   NOT NULL CHECK (role IN ('ask', 'bid'))
          );

          SELECT create_hypertable('${table_name}', 'time', 'price', 2);
      `);

  await client.query(`
          CREATE MATERIALIZED VIEW IF NOT EXISTS "${table_name}_klines_1m" AS
          SELECT
              time_bucket('1 minute', time) AS bucket,
              first(price, time) AS open,
              max(price) AS high,
              min(price) AS low,
              last(price, time) AS close,
              sum(volume) AS volume,
              currency_code
          FROM "${table_name}"
          GROUP BY bucket, currency_code;
      `);

  await client.query(`
          CREATE MATERIALIZED VIEW IF NOT EXISTS "${table_name}_klines_1h" AS
          SELECT
              time_bucket('1 hour', time) AS bucket,
              first(price, time) AS open,
              max(price) AS high,
              min(price) AS low,
              last(price, time) AS close,
              sum(volume) AS volume,
              currency_code
          FROM "${table_name}"
          GROUP BY bucket, currency_code;
      `);

  await client.query(`
          CREATE MATERIALIZED VIEW IF NOT EXISTS "${table_name}_klines_1w" AS
          SELECT
              time_bucket('1 week', time) AS bucket,
              first(price, time) AS open,
              max(price) AS high,
              min(price) AS low,
              last(price, time) AS close,
              sum(volume) AS volume,
              currency_code
          FROM "${table_name}"
          GROUP BY bucket, currency_code;
      `);
};
