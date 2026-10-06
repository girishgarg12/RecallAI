import { parseDocumentSummaries } from "../src/utils/geminiSummaryParser.js";

function runParserTests() {
    console.log("Testing geminiSummaryParser...\n");

    // Test 1: Standard delimiters
    const sample1 = `
[DOCUMENT 10 SUMMARY]
Summary of doc 10.
[END DOCUMENT 10 SUMMARY]

[DOCUMENT 20 SUMMARY]
Summary of doc 20.
[END DOCUMENT 20 SUMMARY]
`;
    const res1 = parseDocumentSummaries(sample1, [10, 20]);
    if (res1.length !== 2 || res1[0].summary !== "Summary of doc 10.") {
        throw new Error("Test 1 failed");
    }

    // Test 2: Markdown bold and colons
    const sample2 = `
**[DOCUMENT 10 SUMMARY]**:
Summary of doc 10 with markdown.
**[END DOCUMENT 10 SUMMARY]**

### [DOCUMENT 20 SUMMARY]
Summary of doc 20 with markdown.
[END DOCUMENT 20 SUMMARY]
`;
    const res2 = parseDocumentSummaries(sample2, [10, 20]);
    if (res2.length !== 2 || !res2[0].summary.includes("Summary of doc 10 with markdown.")) {
        throw new Error("Test 2 failed");
    }

    // Test 3: Missing end delimiter for doc 10
    const sample3 = `
[DOCUMENT 10 SUMMARY]
Summary of doc 10 without end delimiter.

[DOCUMENT 20 SUMMARY]
Summary of doc 20 with end delimiter.
[END DOCUMENT 20 SUMMARY]
`;
    const res3 = parseDocumentSummaries(sample3, [10, 20]);
    if (res3.length !== 2 || !res3[0].summary.includes("Summary of doc 10 without end delimiter.")) {
        throw new Error("Test 3 failed");
    }

    // Test 4: Missing document in model response with fallback
    const sample4 = `
[DOCUMENT 10 SUMMARY]
Only doc 10 exists here.
[END DOCUMENT 10 SUMMARY]
`;
    const res4 = parseDocumentSummaries(sample4, [10, 20]);
    if (res4.length !== 2 || res4[1].documentId !== 20 || !res4[1].summary.includes("unavailable")) {
        throw new Error("Test 4 failed");
    }

    console.log("All geminiSummaryParser tests passed successfully!");
}

runParserTests();
