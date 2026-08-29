import express from "express";
import authenticate from "../middleware/authenticate.js";
import validateCreateMessage from "../middleware/validateCreateMessage.js";
import * as messageController from "../controllers/message.controller.js";

const router = express.Router();

router.post(
    "/:knowledgeBaseId/conversations/:conversationId/messages",
    authenticate,
    validateCreateMessage,
    messageController.sendMessage
);

export default router;