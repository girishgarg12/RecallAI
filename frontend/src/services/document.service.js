/**
 * Document API service
 *
 * POST   /knowledge-bases/:kbId/conversations/:convId/documents
 *          multipart/form-data field: "document" (file)
 *          → 202 { message, document }
 *
 * GET    /knowledge-bases/:kbId/documents
 *          → { documents: [ ... ] }
 *
 * GET    /knowledge-bases/:kbId/conversations/:convId/documents
 *          → { documents: [ ... ] }
 *
 * GET    /knowledge-bases/:kbId/documents/:documentId
 *          → { document }
 *
 * PATCH  /knowledge-bases/:kbId/documents/:documentId
 *          { name } → { message, document }
 *
 * DELETE /knowledge-bases/:kbId/documents/:documentId
 *          → 204
 *
 * GET    /knowledge-bases/:kbId/documents/:documentId/download
 *          → file download
 *
 * Document status values: "UPLOADED" | "PROCESSING" | "READY" | "FAILED"
 * Accepted mime types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain, text/markdown
 */

import apiClient from './apiClient.js';

export async function uploadDocument(knowledgeBaseId, conversationId, file) {
  const formData = new FormData();
  formData.append('document', file);

  const { data } = await apiClient.post(
    `/knowledge-bases/${knowledgeBaseId}/conversations/${conversationId}/documents`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return data; // { message, document }
}

export async function getDocuments(knowledgeBaseId) {
  const { data } = await apiClient.get(`/knowledge-bases/${knowledgeBaseId}/documents`);
  return data; // { documents }
}

export async function getConversationDocuments(knowledgeBaseId, conversationId) {
  const { data } = await apiClient.get(
    `/knowledge-bases/${knowledgeBaseId}/conversations/${conversationId}/documents`
  );
  return data; // { documents }
}

export async function getDocument(knowledgeBaseId, documentId) {
  const { data } = await apiClient.get(
    `/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`
  );
  return data; // { document }
}

export async function updateDocument(knowledgeBaseId, documentId, name) {
  const { data } = await apiClient.patch(
    `/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`,
    { name }
  );
  return data; // { message, document }
}

export async function deleteDocument(knowledgeBaseId, documentId) {
  await apiClient.delete(
    `/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`
  );
}

export async function downloadDocument(knowledgeBaseId, documentId, fileName) {
  const response = await apiClient.get(
    `/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/download`,
    { responseType: 'blob' }
  );

  // Trigger browser download
  const url = window.URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'document';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
