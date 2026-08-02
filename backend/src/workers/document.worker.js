import { Worker } from 'bullmq';
import connection from '../queues/connection.js';
import { QUEUE_NAMES } from '../constants/queue.constants.js';
import * as documentService from '../services/document.service.js';

const worker = new Worker(
    QUEUE_NAMES.DOCUMENT_PROCESSING,
    async (job) => {
        await documentService.processDocument(job.data.documentId);
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