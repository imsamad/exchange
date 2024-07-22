"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
const redis_1 = require("redis");
class RedisManager {
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: process.env.REDIS_URL,
        });
        this.client.connect();
    }
    static getInstance() {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager();
        }
        return RedisManager.instance;
    }
    sendToApi(clientId, message) {
        this.client.publish(clientId, JSON.stringify(message));
    }
    pushMessage(message) {
        this.client.lPush(`db_processor`, JSON.stringify(message));
    }
    publishMessage(channel, message) {
        this.client.publish(channel, JSON.stringify(message));
    }
}
exports.RedisManager = RedisManager;
