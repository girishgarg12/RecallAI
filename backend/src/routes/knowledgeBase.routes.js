import express from 'express';
import authenticate from '../middleware/authenticate.js';
import validateCreateKnowledgeBase from '../middleware/validateCreateKnowledgeBase.js';
import validategetKnowledgeBases from '../middleware/validategetKnowledgeBases.js';
import * as knowledgeBaseController from '../controllers/knowledgeBase.controller.js';

const router = express.Router();

router.post("/", authenticate, validateCreateKnowledgeBase, knowledgeBaseController.createKnowledgeBase);

router.get("/", authenticate, validategetKnowledgeBases, knowledgeBaseController.getKnowledgeBasesByWorkspace);

export default router;