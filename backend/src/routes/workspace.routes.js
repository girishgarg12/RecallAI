import express from 'express';
import * as workspaceController from "../controllers/workspace.controller.js";
import authenticate from '../middleware/authenticate.js';
import validateCreateWorkspace from '../middleware/validateCreateWorkspace.js';
import validatePatchUser from '../middleware/validatePatchUser.js';
import validatePatchWorkspace from '../middleware/validatePatchWorkspace.js';

const router = express.Router();

router.post("/", authenticate, validateCreateWorkspace, workspaceController.createWorkspace);

router.get("/", authenticate, workspaceController.getOwnedWorkspaces);

router.get("/:id", authenticate, workspaceController.getOwnedWorkspaceById);

router.patch("/:id", authenticate, validatePatchWorkspace, workspaceController.updateOwnedWorkspace);

export default router;
