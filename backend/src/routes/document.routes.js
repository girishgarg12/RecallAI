import express from 'express';
import * as documentController from '../controllers/document.controller.js';
import authenticate from '../middleware/authenticate.js';
import validateUploadDocument from '../middleware/validateUploadDocument.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post("/:knowledgeBaseId/documents", authenticate,
    upload.single("document"),
    (req, res, next) => {
        console.log(req.file);
        next();
    },
    validateUploadDocument,
    documentController.uploadDocument
);

export default router;