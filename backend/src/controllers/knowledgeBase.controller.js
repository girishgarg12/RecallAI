import * as knowledgeBaseService from "../services/knowledgeBase.service.js";

export async function createKnowledgeBase(req, res) {
    const knowledgeBase = await knowledgeBaseService.createKnowledgeBase(
        req.body,
        req.user
    )
    res.status(201).json(knowledgeBase);
}

export async function getKnowledgeBasesByWorkspace(req, res) {
    const { workspaceId } = req.query;
    const knowledgeBases = await knowledgeBaseService.getKnowledgeBasesByWorkspace(
        workspaceId,
        req.user
    )
    res.status(200).json(knowledgeBases);
}