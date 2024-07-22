"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PGManager = void 0;
const pg_1 = require("pg");
class PGManager {
    constructor() {
        this.client = new pg_1.Client(process.env.DATABASE_URL);
        this.client.connect();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new PGManager();
        }
        return this.instance;
    }
    getClient() {
        if (!PGManager.instance) {
            PGManager.instance = new PGManager();
        }
        return this.client;
    }
}
exports.PGManager = PGManager;
