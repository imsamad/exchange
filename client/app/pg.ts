import { Pool } from 'pg';

// const client = new Client("postgres://postgres:mypwd@localhost:5432/exchange");
// await client.connect();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
});

pool.connect();
export { pool as pgPool };
