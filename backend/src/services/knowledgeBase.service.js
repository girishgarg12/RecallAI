import * as knowledgeBaseRepository from "../repositories/knowledgeBase.repository.js";
import * as workspaceService from "./workspace.service.js";
import AppError from "../errors/AppError.js";

export async function createKnowledgeBase(knowledgeBaseData, authenticatedUser) {
    
    const validWorkspace = await workspaceService.getOwnedWorkspacebyId(
        knowledgeBaseData.workspaceId,
        authenticatedUser
    );

    const knowledgeBase = await knowledgeBaseRepository.createKnowledgeBase(knowledgeBaseData);
    return knowledgeBase;
}

export async function getKnowledgeBasesByWorkspace(workspaceId, authenticatedUser) {
    const validWorkspace = await workspaceService.getOwnedWorkspacebyId(
        workspaceId,
        authenticatedUser
    )

    const knowledgeBases = await knowledgeBaseRepository.getKnowledgeBasesByWorkspace(
        workspaceId
    )
    return knowledgeBases;
}

export async function getKnowledgeBaseById(knowledgeBaseId, authenticatedUser) {
    const knowledgeBase = await knowledgeBaseRepository.findKnowledgeBaseById(
        Number(knowledgeBaseId)
    )
    if(!knowledgeBase)
        throw new AppError("KnowledgeBase not found", 404);

    const workspaceId = knowledgeBase.workspace_id;
    const validWorkspace = await workspaceService.getOwnedWorkspacebyId(
        workspaceId,
        authenticatedUser
    )
    const { workspace_id, ...knowledgeBaseResponse } = knowledgeBase;

    return knowledgeBaseResponse;
}