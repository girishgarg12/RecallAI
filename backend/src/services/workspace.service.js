import * as workspaceRepository from "../repositories/workspace.repository.js";

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