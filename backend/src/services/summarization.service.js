import config from "../config/index.js";

import * as groqSummarizationService
    from "./summarization/groqSummarization.service.js";

import * as geminiSummarizationService
    from "./summarization/geminiSummarization.service.js";


function getSummarizationService() {
    switch (config.summarization.provider) {
        case "groq":
            return groqSummarizationService;

        case "gemini":
            return geminiSummarizationService;

        default:
            throw new Error(
                `Unsupported summarizer provider: ${config.summarization.provider}`
            );
    }
}


export async function summarizeDocuments(chunks) {
    const summarizationService =
        getSummarizationService();

    return summarizationService.summarizeDocuments(
        chunks
    );
}


export async function combineDocumentSummaries(
    documentSummaries
) {
    const summarizationService =
        getSummarizationService();

    return summarizationService.combineDocumentSummaries(
        documentSummaries
    );
}