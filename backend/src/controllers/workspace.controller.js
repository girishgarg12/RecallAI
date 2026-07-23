import * as workspaceService from "../services/workspace.service.js";

export async function createWorkspace(req, res) {
    const workspace = await workspaceService.createWorkspace(
        req.body,
        req.user
    )
    res.status(201).json(workspace);
}

export async function getOwnedWorkspaces(req, res) {
    const workspaces = await workspaceService.getOwnedWorkspaces(req.user);
    res.status(200).json(workspaces);
}

export async function getOwnedWorkspaceById(req, res) {
    const workspaceId = req.params.id;
    const workspace = await workspaceService.getOwnedWorkspacebyId(workspaceId, req.user);
    res.status(200).json(workspace);
}