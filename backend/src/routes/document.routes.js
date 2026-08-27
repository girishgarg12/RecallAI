import express from 'express';
import * as documentController from '../controllers/document.controller.js';
import authenticate from '../middleware/authenticate.js';
import validateUploadDocument from '../middleware/validateUploadDocument.js';
import validateAskQuestion from '../middleware/validateAskQuestion.js';
import * as chatController from '../controllers/chat.controller.js';
import validateUpdateDocument from '../middleware/validateUpdateDocument.js'
import upload from '../config/multer.js';

const router = express.Router();

router.post("/:knowledgeBaseId/documents", authenticate,
    upload.single("document"),
    validateUploadDocument,
    documentController.uploadDocument
);

router.post("/:knowledgeBaseId/chat", 
    authenticate,
    validateAskQuestion,
    chatController.askQuestion
);

router.delete("/:knowledgeBaseId/documents/:documentId", authenticate,
    documentController.deleteDocument
);

router.get(
    "/:knowledgeBaseId/documents",
    authenticate,
    documentController.getDocuments
);

router.get(
    "/:knowledgeBaseId/documents/:documentId",
    authenticate,
    documentController.getDocument
);

router.patch(
    "/:knowledgeBaseId/documents/:documentId",
    authenticate,
    validateUpdateDocument,
    documentController.updateDocument
);


export default router;