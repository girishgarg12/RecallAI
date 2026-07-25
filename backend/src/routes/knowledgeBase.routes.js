import express from 'express';
import authenticate from '../middleware/authenticate.js';
import validateCreateKnowledgeBase from '../middleware/validateCreateKnowledgeBase.js';
import validategetKnowledgeBases from '../middleware/validategetKnowledgeBases.js';
import validatePatchKnowledgeBase from '../middleware/validatePatchKnowledgeBase.js';
import * as knowledgeBaseController from '../controllers/knowledgeBase.controller.js';

const router = express.Router();

router.post("/", authenticate, validateCreateKnowledgeBase, knowledgeBaseController.createKnowledgeBase);

router.get("/", authenticate, validategetKnowledgeBases, knowledgeBaseController.getKnowledgeBasesByWorkspace);

router.get("/:knowledgeBaseId", authenticate, knowledgeBaseController.getKnowledgeBaseById);

router.patch("/:knowledgeBaseId", authenticate, validatePatchKnowledgeBase, knowledgeBaseController.patchKnowledgeBase);

router.delete("/:knowledgeBaseId", authenticate, knowledgeBaseController.deleteKnowledgeBase);

export default router;