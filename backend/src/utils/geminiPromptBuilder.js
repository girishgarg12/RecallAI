const DOCUMENT_SUMMARY_SYSTEM_PROMPT = `
You are a document summarization assistant in a Retrieval-Augmented Generation system.

You will receive content from one or more documents.

Each document is explicitly marked with its document ID.

Your task is to summarize EACH document separately.

Rules:
- Return exactly one summary for each document ID provided.
- Do not combine information from different documents.
- Preserve important facts, concepts, relationships, conclusions,
  and relevant technical details.
- Do not invent information.
- Do not use information that is not present in the provided content.
- Preserve the meaning and context of the original documents.
- If a document is represented by multiple parts, treat all its parts
  as belonging to the same document.
- Return only the summaries.
`;

export function buildDocumentSummaryPrompt(batch) {
    const documents = new Map();

    for (const item of batch) {
        if (!documents.has(item.documentId)) {
            documents.set(item.documentId, []);
        }

        documents
            .get(item.documentId)
            .push(...item.chunks);
    }

    const content = Array.from(documents.entries())
        .map(([documentId, chunks]) => {
            const chunkContent = chunks
                .map(chunk =>
                    `[Chunk ${chunk.chunkIndex}]
${chunk.content}`
                )
                .join("\n\n");

            return `
[DOCUMENT ${documentId}]

${chunkContent}

[END DOCUMENT ${documentId}]
`;
        })
        .join("\n\n");

    const outputFormat = Array.from(documents.keys())
        .map(documentId =>
            `[DOCUMENT ${documentId} SUMMARY]
<summary>
[END DOCUMENT ${documentId} SUMMARY]`
        )
        .join("\n\n");

    return {
        systemPrompt: DOCUMENT_SUMMARY_SYSTEM_PROMPT,

        userPrompt: `
Summarize the following documents separately.

${content}

Return the result using exactly this structure:

${outputFormat}
`
    };
}