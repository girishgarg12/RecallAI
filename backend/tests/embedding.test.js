import * as embeddingService from '../src/services/embedding.service.js';

async function testEmbedding(){
    const output = await embeddingService.embed([
        "my name is girish garg",
        "I m working on recallAI"
    ]);
    console.log(output);
}

// const chunks = [];

// for (let i = 0; i < 100; i++) {
//     chunks.push(`This is test chunk number ${i}`);
// }

// const start = Date.now();

// await embeddingService.embed(chunks);

// console.log(Date.now() - start);

testEmbedding();
