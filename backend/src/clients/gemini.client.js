import { GoogleGenAI } from "@google/genai";
import config from "../config/index.js";

const geminiClient = new GoogleGenAI({
    apiKey: config.llm.gemini.apiKey
});

export default geminiClient;