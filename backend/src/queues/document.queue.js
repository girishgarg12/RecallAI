import { Queue } from "bullmq";
import { createRedisConnection } from "./connection.js";
import { QUEUE_NAMES } from "../constants/queue.constants.js";

const documentQueue = new Queue(
    QUEUE_NAMES.DOCUMENT_PROCESSING,
    {
        connection: createRedisConnection("API")
    }
);

export default documentQueue;