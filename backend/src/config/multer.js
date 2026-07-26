import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import config from '.';

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
        fileSize : config.upload.maxFileSize;
    }
});


export default upload;