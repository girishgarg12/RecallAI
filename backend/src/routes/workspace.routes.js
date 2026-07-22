import express from 'express';
import * as workspaceController from "../controllers/workspace.controller.js";
import authenticate from '../middleware/authenticate.js';
import validateCreateWorkspace from '../middleware/validateCreateWorkspace.js';

const router = express.Router();

router.post("/", authenticate, validateCreateWorkspace, workspaceController.createWorkspace);

router.get("/", authenticate, workspaceController.getOwnedWorkspaces);

export default router;
