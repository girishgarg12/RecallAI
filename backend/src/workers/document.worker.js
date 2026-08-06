import { Worker } from 'bullmq';
import { createRedisConnection } from '../queues/connection.js';
import { QUEUE_NAMES } from '../constants/queue.constants.js';
import * as documentProcessingService from "../services/processDoument.service.js";

const connection = createRedisConnection("Worker");

const worker = new Worker(
    QUEUE_NAMES.DOCUMENT_PROCESSING,
    async (job) => {
        await documentProcessingService.processDocument(job.data.documentId);
    },
    {
        connection
    }
)

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed.`);
});

worker.on("failed", (job, error) => {
    console.log(`Job ${job.id} failed:`, error.message);
});


export default worker;