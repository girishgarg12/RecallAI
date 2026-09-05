import config from "../../config/index.js";

import * as llmService from "../llm.service.js";

import {
    createGeminiBatches
} from "../../utils/geminiBatcher.js";

import {
    buildDocumentSummaryPrompt
} from "../../utils/geminiPromptBuilder.js";

import {
    parseDocumentSummaries
} from "../../utils/geminiSummaryParser.js";

export async function summarizeBatch(batch) {
    const {
        systemPrompt,
        userPrompt
    } = buildDocumentSummaryPrompt(batch);

    const documentIds = [
        ...new Set(
            batch.map(item => item.documentId)
        )
    ];

    console.log(
        `[Gemini Batch] ` +
        `documents=${documentIds.join(",")}`
    );

    const start = Date.now();

    const response =
        await llmService.summarize({
            systemPrompt,
            userPrompt
        });

    const summaries =
        parseDocumentSummaries(
            response,
            documentIds
        );

    console.log(
        `[Gemini Batch] Completed in ${(
            (Date.now() - start) / 1000
        ).toFixed(3)}s`
    );

    return summaries;
}

export async function summarizeDocuments(chunks) {
    if (chunks.length === 0) {
        return [];
    }

    const batches = createGeminiBatches(
        chunks,
        config.summarization.geminiBatchTokenLimit
    );

    console.log(
        `[Gemini Batch Summarization] ` +
        `${batches.length} batches`
    );

    const batchSummaries = [];

    for (let i = 0; i < batches.length; i++) {
        console.log(
            `[Gemini Batch Summarization] ` +
            `Processing batch ${i + 1}/${batches.length}`
        );

        const summaries =
            await summarizeBatch(
                batches[i]
            );

        batchSummaries.push(...summaries);
    }

    const documentSummaries =
        mergeDocumentSummaries(
            batchSummaries
        );

    return reduceDocumentSummaries(
        documentSummaries
    );
}

function mergeDocumentSummaries(
    batchSummaries
) {
    const documents = new Map();

    for (const item of batchSummaries) {
        if (!documents.has(item.documentId)) {
            documents.set(
                item.documentId,
                []
            );
        }

        documents
            .get(item.documentId)
            .push(item.summary);
    }

    return Array.from(
        documents.entries()
    ).map(([documentId, summaries]) => ({
        documentId,
        summaries
    }));
}

async function reduceDocumentSummary(
    documentId,
    summaries
) {
    if (summaries.length === 1) {
        return summaries[0];
    }

    const systemPrompt = `
You are a document summary reduction assistant.

You will receive multiple partial summaries of the same document.

Your task is to combine them into one coherent final summary
representing the entire document.

Rules:
- Preserve important facts, concepts, relationships, conclusions,
  and relevant technical details.
- Do not lose important information from any partial summary.
- Remove unnecessary repetition.
- Do not invent information.
- Do not introduce information that is not present in the summaries.
- Preserve the meaning and context of the original document.
- Return only the final summary.
`;

    const userPrompt = `
The following are partial summaries of document ${documentId}:

${summaries
    .map(
        (summary, index) =>
            `[PARTIAL SUMMARY ${index + 1}]
${summary}
[END PARTIAL SUMMARY ${index + 1}]`
    )
    .join("\n\n")}

Combine these partial summaries into one complete final summary
of document ${documentId}.
`;

    console.log(
        `[Gemini Reduction] ` +
        `document=${documentId} | ` +
        `summaries=${summaries.length}`
    );

    const start = Date.now();

    const finalSummary =
        await llmService.summarize({
            systemPrompt,
            userPrompt
        });

    console.log(
        `[Gemini Reduction] ` +
        `document=${documentId} | ` +
        `Completed in ${(
            (Date.now() - start) / 1000
        ).toFixed(3)}s`
    );

    return finalSummary.trim();
}

export async function reduceDocumentSummaries(
    documentSummaries
) {
    const results = [];

    for (const document of documentSummaries) {
        const summary =
            await reduceDocumentSummary(
                document.documentId,
                document.summaries
            );

        results.push({
            documentId: document.documentId,
            summary
        });
    }

    return results;
}

export async function combineDocumentSummaries(
    documentSummaries
) {
    if (documentSummaries.length === 0) {
        return "";
    }

    if (documentSummaries.length === 1) {
        return documentSummaries[0].summary;
    }

    const combinedContent = documentSummaries
        .map(document =>
            `[Document ${document.documentId}]
${document.summary}`
        )
        .join("\n\n");

    const systemPrompt = `
You are consolidating summaries from multiple documents.

Create one coherent summary representing the information
contained across all provided documents.

Requirements:
- Preserve important information from each document.
- Keep information logically organized.
- Do not invent information.
- Do not incorrectly merge unrelated facts.
- Remove unnecessary repetition.
- Return only the consolidated summary.
`;

    return llmService.summarize({
        systemPrompt,
        userPrompt: combinedContent
    });
}