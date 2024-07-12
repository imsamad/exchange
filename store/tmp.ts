import { Client } from "pg";

const pgClient = new Client({
  user: "postgres",
  host: "localhost",
  database: "exchange",
  password: "mypwd",
  port: 5432,
});

pgClient
  .connect()
  .then(() => {
    console.log("first");
  })
  .catch((err) => {
    console.log("errL ", err);
  });
