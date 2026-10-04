import dotenv from "dotenv";

dotenv.config();

const rawPort = process.env.PORT;
let port = 3000;

if (rawPort !== undefined) {
    port = Number(rawPort);

    if (Number.isNaN(port)) {
        throw new Error("Invalid configuration: PORT must be a number.");
    }

    if (!Number.isInteger(port)) {
        throw new Error("Invalid configuration: PORT must be an integer.");
    }

    if (port < 0 || port > 65535) {
        throw new Error(
            "Invalid configuration: PORT must be between 0 and 65535."
        );
    }
}

const config = {
    port,

    env: process.env.NODE_ENV || "development",
    
    database: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN
    },
    upload: {
        maxFileSize: 50 * 1024 * 1024
    },
    storage: {
        uploadDirectory: "uploads"
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    },
    ollama: {
        host: process.env.OLLAMA_HOST,
        embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL
    },
    rag: {
        chunkSize: 1200,
        chunkOverlap: 100,
        minChunkLength: 100,    // 20% of chunkSize
        topK: 5
    },
    
    summarization: {
        provider: process.env.SUMMARIZER_PROVIDER,
        batchTokenLimit: 4000,
        geminiBatchTokenLimit: 200000
    },

    llm: {
        provider: process.env.LLM_PROVIDER,

        groq: {
            apiKey: process.env.GROQ_API_KEY,
            generationModel: process.env.GROQ_GENERATION_MODEL,
            summarizerModel: process.env.GROQ_SUMMARIZER_MODEL,
            plannerModel: process.env.GROQ_PLANNER_MODEL
        },

        gemini: {
            apiKey: process.env.GEMINI_API_KEY,
            summarizerModel: process.env.GEMINI_SUMMARIZER_MODEL
        }
    },

    urlIngestion: {
        // Maximum response body size in bytes (default: 10 MB).
        // Configurable via URL_MAX_RESPONSE_SIZE env variable.
        maxResponseSize: Number(process.env.URL_MAX_RESPONSE_SIZE) || 10 * 1024 * 1024,

        // Network request timeout in milliseconds (default: 20 seconds).
        // Configurable via URL_FETCH_TIMEOUT_MS env variable.
        timeoutMs: Number(process.env.URL_FETCH_TIMEOUT_MS) || 20000,

        // Maximum number of redirects to follow manually (SSRF-safe).
        maxRedirects: 5
    }

};


export default config;