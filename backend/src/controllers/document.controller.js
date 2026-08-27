import * as documentService from '../services/document.service.js';

export async function uploadDocument(req, res) {
    const { knowledgeBaseId } = req.params;
    const uploadedFile = req.file;
    const document = await documentService.uploadDocument(
        knowledgeBaseId,
        uploadedFile,
        req.user
    );
    return res.status(202).json({
        message: "Document accepted for processing",
        document
    });
}

export async function deleteDocument(req, res) {
    const { knowledgeBaseId } = req.params;
    const { documentId } = req.params;
    await documentService.deleteDocument(
        knowledgeBaseId,
        documentId,
        req.user
    );
    return res.sendStatus(204);
}

export async function getDocuments(req, res) {

    const { knowledgeBaseId } = req.params;

    const documents = await documentService.getDocuments(
        knowledgeBaseId,
        req.user
    );

    return res.status(200).json({
        documents
    });
}

export async function getDocument(req, res) {
    const { knowledgeBaseId, documentId } = req.params;

    const document = await documentService.getDocument(
        knowledgeBaseId,
        documentId,
        req.user
    );

    return res.status(200).json({
        document
    });
}

export async function updateDocument(req, res) {
    const { knowledgeBaseId, documentId } = req.params;
    const { name } = req.body;

    const document = await documentService.updateDocument(
        knowledgeBaseId,
        documentId,
        name,
        req.user
    );

    return res.status(200).json({
        message: "Document updated successfully",
        document
    });
}