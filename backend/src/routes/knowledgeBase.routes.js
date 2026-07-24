import express from 'express';
import authenticate from '../middleware/authenticate.js';
import validateCreateKnowledgeBase from '../middleware/validateCreateKnowledgeBase.js';
import * as knowledgeBaseController from '../controllers/knowledgeBase.controller.js';

const router = express.Router();

router.post("/", authenticate, validateCreateKnowledgeBase, knowledgeBaseController.createKnowledgeBase);

export default router;