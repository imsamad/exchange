import { Client } from "pg";

let retryCount = 0;

export const connectPgWithRetry = async (): Promise<Client | void> => {
  try {
    const pgClient = new Client(process.env.DATABASE_URL);
    await pgClient.connect();

    return pgClient;
  } catch (error) {
    console.error("error while conenecting pg: ", error);
    if (retryCount < 5) {
      setTimeout(() => {
        connectPgWithRetry();
      }, 10000);
    } else {
      process.exit();
    }
  }
};
