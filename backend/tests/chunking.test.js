import { chunk } from "../src/services/chunking.service.js";

const text = `
This is sentence one. This is sentence two. This is sentence three.
This is sentence four. This is sentence five. This is sentence six.
`;

const chunks = await chunk(text);

console.log("Number of chunks:", chunks.length);

chunks.forEach((chunk, index) => {
    console.log("\n---------------------------");
    console.log(`Chunk ${index + 1}`);
    console.log("Length:", chunk.length);
    console.log(chunk);
});