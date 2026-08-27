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