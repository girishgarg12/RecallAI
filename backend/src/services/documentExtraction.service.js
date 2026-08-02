import AppError from "../errors/AppError.js";
import config from "../config/index.js";
import { DOCUMENT_MIME_TYPES } from "../constants/document.constants.js";
import path from 'path';
import fs from "fs/promises";
import pdfParse from 'pdf-parse';

export async function extract(document) {
    switch(document.mime_type){
        case DOCUMENT_MIME_TYPES.PDF:
            return extractPdf(document);

        default:
            throw new AppError("Unsupported document type", 400);
    }
}

async function extractPdf(document) {
    const filepath = path.join(process.cwd(), 
        config.storage.uploadDirectory,
        document.storage_key
    );

    const pdfBuffer = await fs.readFile(filepath);
    const parsedPdf = await pdfParse(pdfBuffer);
    return parsedPdf.text;
}