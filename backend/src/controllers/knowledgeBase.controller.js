import * as knowledgeBaseService from "../services/knowledgeBase.service.js";

export async function createKnowledgeBase(req, res) {
    const knowledgeBase = await knowledgeBaseService.createKnowledgeBase(
        req.body,
        req.user
    )
    res.status(201).json(knowledgeBase);
}