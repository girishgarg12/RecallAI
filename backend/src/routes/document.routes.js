import express from 'express';
import * as documentController from '../controllers/document.controller.js';
import authenticate from '../middleware/authenticate.js';
import validateUploadDocument from '../middleware/validateUploadDocument.js';
import validateAskQuestion from '../middleware/validateAskQuestion.js';
import validateUpdateDocument from '../middleware/validateUpdateDocument.js';
import validateAddUrlSource from '../middleware/validateAddUrlSource.js';
import validateAddRepositorySource from '../middleware/validateAddRepositorySource.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post(
    "/:knowledgeBaseId/conversations/:conversationId/documents",
    authenticate,
    upload.single("document"),
    validateUploadDocument,
    documentController.uploadDocument
);

router.post(
    "/:knowledgeBaseId/conversations/:conversationId/sources/url",
    authenticate,
    validateAddUrlSource,
    documentController.addUrlSource
);

router.post(
    "/:knowledgeBaseId/conversations/:conversationId/sources/repository",
    authenticate,
    validateAddRepositorySource,
    documentController.addRepositorySource
);

router.get(
    "/:knowledgeBaseId/documents/:documentId/files",
    authenticate,
    documentController.getRepositoryFiles
);


router.delete("/:knowledgeBaseId/documents/:documentId", authenticate,
    documentController.deleteDocument
);

router.get(
    "/:knowledgeBaseId/conversations/:conversationId/documents",
    authenticate,
    documentController.getConversationDocuments
);

router.get(
    "/:knowledgeBaseId/documents",
    authenticate,
    documentController.getDocuments
);

router.get(
    "/:knowledgeBaseId/documents/:documentId/download",
    authenticate,
    documentController.downloadDocument
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