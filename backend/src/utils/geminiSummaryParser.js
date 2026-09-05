import AppError from "../errors/AppError.js";

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

    for (const documentId of expectedDocumentIds) {
        const startMarker =
            `[DOCUMENT ${documentId} SUMMARY]`;

        const endMarker =
            `[END DOCUMENT ${documentId} SUMMARY]`;

        const startIndex =
            responseText.indexOf(startMarker);

        const endIndex =
            responseText.indexOf(
                endMarker,
                startIndex + startMarker.length
            );

        if (
            startIndex === -1 ||
            endIndex === -1 ||
            endIndex <= startIndex
        ) {
            throw new AppError(
                `Gemini did not return a valid summary for document ${documentId}`,
                500
            );
        }

        const summary =
            responseText
                .slice(
                    startIndex + startMarker.length,
                    endIndex
                )
                .trim();

        if (!summary) {
            throw new AppError(
                `Gemini returned an empty summary for document ${documentId}`,
                500
            );
        }

        summaries.push({
            documentId,
            summary
        });
    }

    return summaries;
}