import documentQueue from "../src/queues/document.queue.js";

async function addTestJob(){
    const job = await documentQueue.add(
        "process-document",
        {
            documentId : 1,
            knowledgeBaseId : 10,
            fileName : "sample.pdf"
        }
    );
    console.log("Job added", job.id);
    process.exit(0);
}
addTestJob().catch((error) =>{
    console.error(error);
    process.exit(1);
    process.exit(1);
});
