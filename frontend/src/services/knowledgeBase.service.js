/**
 * Knowledge Base API service
 *
 * POST   /knowledge-bases                       — { name, description?, workspaceId } → kb
 * GET    /knowledge-bases?workspaceId=N         — → [ kb ]
 * GET    /knowledge-bases/:knowledgeBaseId      — → kb
 * PATCH  /knowledge-bases/:knowledgeBaseId      — { name?, description? } → kb
 * DELETE /knowledge-bases/:knowledgeBaseId      — 204
 *
 * NOTE: workspaceId in POST body must be a number (integer).
 * NOTE: GET requires workspaceId as a query param (integer string is fine — backend parses it).
 */

import apiClient from './apiClient.js';

export async function createKnowledgeBase({ name, description, workspaceId }) {
  const payload = { name, workspaceId: Number(workspaceId) };
  if (description !== undefined) payload.description = description;
  const { data } = await apiClient.post('/knowledge-bases', payload);
  return data;
}

export async function getKnowledgeBasesByWorkspace(workspaceId) {
  const { data } = await apiClient.get('/knowledge-bases', {
    params: { workspaceId },
  });
  return data; // array of knowledge base objects
}

export async function getKnowledgeBaseById(knowledgeBaseId) {
  const { data } = await apiClient.get(`/knowledge-bases/${knowledgeBaseId}`);
  return data;
}

export async function patchKnowledgeBase(knowledgeBaseId, updates) {
  const { data } = await apiClient.patch(`/knowledge-bases/${knowledgeBaseId}`, updates);
  return data;
}

export async function deleteKnowledgeBase(knowledgeBaseId) {
  await apiClient.delete(`/knowledge-bases/${knowledgeBaseId}`);
}
