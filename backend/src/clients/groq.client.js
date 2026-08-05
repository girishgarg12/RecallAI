import Groq from 'groq-sdk';
import config from '../config/index.js';

const groq = new Groq({
    apiKey : config.llm.apiKey
});

export default groq;