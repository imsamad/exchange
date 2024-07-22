"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
const redis_1 = require("redis");
class RedisManager {
    constructor() {
        // @ts-ignore
        this.subscriber = (0, redis_1.createClient)(process.env.REDIS_URL);
        this.subscriber.connect();
        // @ts-ignore
        this.publisher = (0, redis_1.createClient)(process.env.REDIS_URL);
        this.publisher.connect();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }
    sendAndWait(message) {
        return new Promise((resolve) => {
            const clientId = Math.random().toString().slice(2, 10) +
                Math.random().toString().slice(2, 10);
            this.publisher.lPush("messages", JSON.stringify({
                clientId,
                message,
            }));
            this.subscriber.subscribe(clientId, (message) => {
                try {
                    let _ = JSON.parse(message);
                    resolve(_);
                }
                catch (error) {
                    resolve(message);
                }
            });
        });
    }
}
exports.RedisManager = RedisManager;
