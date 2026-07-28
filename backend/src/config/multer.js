import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import config from './index.js';
import AppError from '../errors/AppError.js';

const allowedExtensions = [
    ".pdf",
    ".docx",
    ".txt",
    ".md"
];

const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown"
];

const storage = multer.diskStorage({

    destination : (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename : (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const filename = `${randomUUID()}${extension}`;

        cb(null, filename);
    }
});

const upload = multer({
    storage,
    limits : {
        fileSize : config.upload.maxFileSize
    },
    fileFilter : (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const isValidExtension = allowedExtensions.includes(extension);
        const isValidMimetype = allowedMimeTypes.includes(file.mimetype);
        if(!isValidExtension || !isValidMimetype){
            return cb(new AppError("Only PDF, DOCX, TXT and Markdown files are allowed.", 400));
        }
        return cb(null, true);
    }
});


export default upload;