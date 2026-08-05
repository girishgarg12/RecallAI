import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import config from '../config/index.js';

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize : config.rag.chunkSize,
    chunkOverlap : config.rag.chunkOverlap
});

export async function chunk(text) {
    const chunks = await splitter.splitText(text);

    return chunks.filter(
        chunk => chunk.trim().length >= config.rag.minChunkLength
    );
}