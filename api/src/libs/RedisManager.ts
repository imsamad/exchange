import { createClient, RedisClientOptions } from 'redis';

class RedisManager {
  private static client: any;

  constructor() {
    if (RedisManager.client) return;

    RedisManager.client = createClient({
      url: 'redis://order_queue:7379',
    });
  }

  static connect() {}
}
