import * as workspaceRepository from "../repositories/workspace.repository.js";
import AppError from '../errors/AppError.js';

export async function createWorkspace(workspaceData, authenticatedUser){
    const workspace = {
        ...workspaceData,
        description: workspaceData.description ?? "",
        visibility: workspaceData.visibility ?? "PRIVATE",
        ownerId: authenticatedUser.id
    }
    const result = await workspaceRepository.createWorkspace(workspace);
    return result;
}

export async function getOwnedWorkspace(authenticatedUser) {
    const ownerId = authenticatedUser.id;
    const workspaces = await workspaceRepository.getOwnedWorkspace(ownerId);
    return workspaces;
}

export async function getOwnedWorkspacebyId(workspaceId, authenticatedUser) {
    const workspace = await workspaceRepository.findOwnedWorkspaceById(
        Number(workspaceId),
        authenticatedUser.id
    )
    if(!workspace){
        throw new AppError("Workspace not found", 404);
    }
    return workspace;
}

export async function updateOwnedWorkspace(workspaceId, authenticatedUser, updates) {
    const workspace = await workspaceRepository.updateOwnedWorkspace(
        Number(workspaceId),
        authenticatedUser.id,
        updates
    )

    if(!workspace)
        throw new AppError("Workspace not found", 404);

    return workspace;
}