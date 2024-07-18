import { Client } from "pg";

export class PGManager {
  private client: Client;
  private static instance: PGManager;
  constructor() {
    this.client = new Client(process.env.DATABASE_URL);

    this.client.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new PGManager();
    }

    return this.instance;
  }

  public getClient() {
    if (!PGManager.instance) {
      PGManager.instance = new PGManager();
    }
    return this.client;
  }
}
