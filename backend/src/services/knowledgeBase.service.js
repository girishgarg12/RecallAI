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