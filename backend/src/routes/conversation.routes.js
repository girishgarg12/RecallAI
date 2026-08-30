import express from "express";
import authenticate from "../middleware/authenticate.js";
import * as conversationController from "../controllers/conversation.controller.js";
import validateRenameConversation from "../middleware/validateRenameConversation.js";

const router = express.Router();

router.post(
    "/:knowledgeBaseId/conversations",
    authenticate,
    conversationController.createConversation
);

router.get(
    "/:knowledgeBaseId/conversations",
    authenticate,
    conversationController.getConversations
);

router.get(
    "/:knowledgeBaseId/conversations/:conversationId",
    authenticate,
    conversationController.getConversation
);

router.patch(
    "/:knowledgeBaseId/conversations/:conversationId",
    authenticate,
    validateRenameConversation,
    conversationController.renameConversation
);

router.delete(
    "/:knowledgeBaseId/conversations/:conversationId",
    authenticate,
    conversationController.deleteConversation
);

export default router;