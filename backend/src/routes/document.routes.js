import express from 'express';
import * as documentController from '../controllers/document.controller.js';
import authenticate from '../middleware/authenticate.js';
import validateUploadDocument from '../middleware/validateUploadDocument.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post("/:knowledgeBaseId/documents", authenticate,
    upload.single("document"),
    validateUploadDocument,
    documentController.uploadDocument
);

router.delete("/:knowledgeBaseId/documents/:documentId", authenticate,
    documentController.deleteDocument
);

export default router;