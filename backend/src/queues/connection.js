import IoRedis from "ioredis";
import config from "../config/index.js";

export function createRedisConnection(name) {
    const connection = new IoRedis({
        host: config.redis.host,
        port: config.redis.port,
        maxRetriesPerRequest: null
    });

    connection.on("connect", () => {
        console.log(`[${name}] Connected to Redis`);
    });

    connection.on("error", (error) => {
        console.error(`[${name}] Redis Error`, error);
    });

    return connection;
}