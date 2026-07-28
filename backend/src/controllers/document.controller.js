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