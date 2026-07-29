import * as documentService from '../services/document.service.js';

export async function uploadDocument(req, res) {
    const { knowledgeBaseId } = req.params;
    const uploadedFile = req.file;
    const document = await documentService.uploadDocument(
        knowledgeBaseId,
        uploadedFile,
        req.user
    );
    return res.status(201).json({
        message : "Document uploaded successfully",
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