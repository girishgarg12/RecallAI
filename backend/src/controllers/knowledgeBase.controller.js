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

export async function getKnowledgeBaseById(req, res) {
    const knowledgeBase = await knowledgeBaseService.getKnowledgeBaseById(
        req.params.knowledgeBaseId,
        req.user
    )
    res.status(200).json(knowledgeBase);
}

export async function patchKnowledgeBase(req, res) {
    const knowledgeBase =
        await knowledgeBaseService.patchKnowledgeBase(
            req.params.knowledgeBaseId,
            req.body,
            req.user
        );

    return res.status(200).json(knowledgeBase);
}

export async function deleteKnowledgeBase(req, res) {
    const result = await knowledgeBaseService.deleteKnowledgeBase(
        req.params.knowledgeBaseId,
        req.user
    )
    return res.sendStatus(204)
}