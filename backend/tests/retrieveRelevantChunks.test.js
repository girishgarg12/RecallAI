import * as retrievalService from '../src/services/retrieval.service.js';

const chunks =
    await retrievalService.retrieveRelevantChunks(
        1,
        "What is secret detection?"
    );

console.log(chunks);