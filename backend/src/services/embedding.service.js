import config from '../config/index.js';
import AppError from '../errors/AppError.js';

export async function embed(chunks) {
    const requestBody = {
        model : config.ollama.embeddingModel,
        input : chunks
    };
    try{
        const response = await fetch(
            `${config.ollama.host}/api/embed`,
            {
                method : "POST",
                headers : {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify(requestBody)
            }
        );
        if(!response.ok){
            throw new AppError("Failed to generate Embeddings", 500);
        }

        const data = await response.json();
        return data.embeddings;
    }
    catch(error){
        throw new AppError("Failed to connect to embedding service", 500);
    }
}