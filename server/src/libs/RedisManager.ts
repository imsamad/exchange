import { createClient, RedisClientType } from "redis";
import { MessageFromEngien, MessageToEngine } from "../types";

export class RedisManager {
  private subscriber: RedisClientType;
  private publisher: RedisClientType;
  private static instance: RedisManager;

  constructor() {
    this.subscriber = createClient({
      url: process.env.REDIS_URL,
    });
    this.subscriber.connect();

    this.publisher = createClient({ url: process.env.REDIS_URL });
    this.publisher.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public sendAndWait(message: MessageToEngine): Promise<MessageFromEngien> {
    return new Promise((resolve) => {
      const clientId =
        Math.random().toString().slice(2, 10) +
        Math.random().toString().slice(2, 10);

      this.publisher.lPush(
        "messages",
        JSON.stringify({
          clientId,
          message,
        })
      );

      this.subscriber.subscribe(clientId, (message: any) => {
        try {
          let _ = JSON.parse(message);
          resolve(_);
        } catch (error) {
          resolve(message);
        }
      });
    });
  }
}
