/**
 * Conversation API service
 *
 * POST   /knowledge-bases/:kbId/conversations
 *          → 201 { message, conversation }
 *          Conversation has: id, knowledge_base_id, user_id, title, active_source_id, created_at, updated_at
 *
 * GET    /knowledge-bases/:kbId/conversations
 *          → { conversations: [ ... ] }
 *
 * GET    /knowledge-bases/:kbId/conversations/:conversationId
 *          → { conversation }
 *
 * PATCH  /knowledge-bases/:kbId/conversations/:conversationId
 *          { title } → { message, conversation }
 *
 * DELETE /knowledge-bases/:kbId/conversations/:conversationId
 *          → 204
 */

import apiClient from './apiClient.js';

export async function createConversation(knowledgeBaseId) {
  const { data } = await apiClient.post(
    `/knowledge-bases/${knowledgeBaseId}/conversations`
  );
  return data; // { message, conversation }
}

export async function getConversations(knowledgeBaseId) {
  const { data } = await apiClient.get(
    `/knowledge-bases/${knowledgeBaseId}/conversations`
  );
  return data; // { conversations }
}

export async function getConversation(knowledgeBaseId, conversationId) {
  const { data } = await apiClient.get(
    `/knowledge-bases/${knowledgeBaseId}/conversations/${conversationId}`
  );
  return data; // { conversation }
}

export async function renameConversation(knowledgeBaseId, conversationId, title) {
  const { data } = await apiClient.patch(
    `/knowledge-bases/${knowledgeBaseId}/conversations/${conversationId}`,
    { title }
  );
  return data; // { message, conversation }
}

export async function deleteConversation(knowledgeBaseId, conversationId) {
  await apiClient.delete(
    `/knowledge-bases/${knowledgeBaseId}/conversations/${conversationId}`
  );
}
