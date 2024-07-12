import { Client } from "pg";
import { connectPgWithRetry } from "./connect-pg";
import { migrateUserAndBalance } from "./createTable";
import { refreshViews } from "./cron";

export const migrate = async (client?: Client): Promise<void> => {
  try {
    const pgClient = client ? client : await connectPgWithRetry();
    if (!pgClient) return;

    await migrateUserAndBalance(pgClient);

    await refreshViews(pgClient);
  } catch (error) {
    console.log("error from migrate");
    process.exit();
  }
};
