import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import config from '../config/index.js';

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize : config.ai.chunkSize,
    chunkOverlap : config.ai.chunkOverlap
});

export async function chunk(text) {
    return splitter.splitText(text);
}