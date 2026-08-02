import IoRedis from "ioredis";
import config from "../config/index.js";

const connection = new IoRedis({
    host : config.redis.host,
    port : config.redis.port,
    maxRetriesPerRequest: null
});

connection.on("connect", () => {
    console.log("Connected to Redis");
});

connection.on("error", (error) => {
    console.log("Redis connection error:", error);
});

export default connection;