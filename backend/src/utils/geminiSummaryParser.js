import AppError from "../errors/AppError.js";

function escapeRegExp(string) {
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseDocumentSummaries(
    responseText,
    expectedDocumentIds
) {
    if (!responseText || !responseText.trim()) {
        throw new AppError(
            "Gemini returned an empty summary response",
            500
        );
    }

    const summaries = [];
    const missingDocumentIds = [];

    for (const documentId of expectedDocumentIds) {
        const escapedId = escapeRegExp(documentId);

        // Matches [DOCUMENT 1 SUMMARY], **[DOCUMENT 1 SUMMARY]**, [DOCUMENT 1 (file.js) SUMMARY], etc.
        const startRegex = new RegExp(
            `(?:\\*\\*|#+\\s*)?\\[?\\s*DOCUMENT\\s+${escapedId}\\b[^\\]]*?SUMMARY\\s*\\]?(?:\\*\\*)?[:\\s]*`,
            "i"
        );

        const startMatch = responseText.match(startRegex);

        if (!startMatch || startMatch.index === undefined) {
            console.warn(`[Gemini Parser] Missing start marker for document ${documentId}`);
            missingDocumentIds.push(documentId);
            continue;
        }

        const startIndex = startMatch.index + startMatch[0].length;
        const textAfterStart = responseText.slice(startIndex);

        // Matches [END DOCUMENT 1 SUMMARY], **[END DOCUMENT 1 SUMMARY]**, etc.
        const endRegex = new RegExp(
            `(?:\\*\\*|#+\\s*)?\\[?\\s*END\\s+DOCUMENT\\s+${escapedId}\\b[^\\]]*?SUMMARY\\s*\\]?(?:\\*\\*)?`,
            "i"
        );
        const endMatch = textAfterStart.match(endRegex);

        let summaryText = "";

        if (endMatch && endMatch.index !== undefined) {
            summaryText = textAfterStart.slice(0, endMatch.index).trim();
        } else {
            // If explicit end marker is missing, stop before the next document's start marker
            const nextDocRegex = /(?:\[|\*{1,2}\[|#+\s*\[)?DOCUMENT\s+\d+\b[^\]]*?SUMMARY(?:\]|\*{1,2}\])?/i;
            const nextMatch = textAfterStart.match(nextDocRegex);

            if (nextMatch && nextMatch.index !== undefined) {
                summaryText = textAfterStart.slice(0, nextMatch.index).trim();
            } else {
                summaryText = textAfterStart.trim();
            }
        }

        if (summaryText) {
            summaries.push({
                documentId,
                summary: summaryText
            });
        } else {
            missingDocumentIds.push(documentId);
        }
    }

    // If no summaries at all could be extracted
    if (summaries.length === 0 && expectedDocumentIds.length > 0) {
        throw new AppError(
            `Gemini did not return any valid summaries for documents: ${expectedDocumentIds.join(", ")}`,
            500
        );
    }

    // Gracefully handle any missing document summaries
    if (missingDocumentIds.length > 0) {
        console.warn(
            `[Gemini Parser] Providing fallback summary for documents: ${missingDocumentIds.join(", ")}`
        );
        for (const missingId of missingDocumentIds) {
            summaries.push({
                documentId: missingId,
                summary: `Content summary unavailable for document ${missingId}.`
            });
        }
    }

    return summaries;
}