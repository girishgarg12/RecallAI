import * as workspaceService from "../services/workspace.service.js";

export async function createWorkspace(req, res) {
    const workspace = await workspaceService.createWorkspace(
        req.body,
        req.user
    )
    res.status(201).json(workspace);
}