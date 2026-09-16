/**
 * Message API service
 *
 * POST   /knowledge-bases/:kbId/conversations/:convId/messages
 *          Body: { content, scope?, sourceId? }
 *          scope values: "SOURCE" | "CONVERSATION" | "KNOWLEDGE_BASE"
 *          - "SOURCE" requires sourceId (a documentId in this conversation)
 *          - "CONVERSATION" retrieves from all docs in the conversation
 *          - "KNOWLEDGE_BASE" retrieves from all docs in the knowledge base
 *          - If scope is omitted, backend uses conversation.active_source_id (defaults to last uploaded doc)
 *          → 201 { userMessage, assistantMessage, sources }
 *          sources: [ { id, name } ] — documents used for RAG retrieval
 *
 * GET    /knowledge-bases/:kbId/conversations/:convId/messages
 *          → { messages: [ { id, conversation_id, role, content, created_at } ] }
 *          role values: "USER" | "ASSISTANT"
 */

import apiClient from './apiClient.js';

export async function sendMessage(knowledgeBaseId, conversationId, { content, scope, sourceId }) {
  const payload = { content };
  if (scope) payload.scope = scope;
  if (sourceId) payload.sourceId = sourceId;

  const { data } = await apiClient.post(
    `/knowledge-bases/${knowledgeBaseId}/conversations/${conversationId}/messages`,
    payload
  );
  return data; // { userMessage, assistantMessage, sources }
}

export async function getMessages(knowledgeBaseId, conversationId) {
  const { data } = await apiClient.get(
    `/knowledge-bases/${knowledgeBaseId}/conversations/${conversationId}/messages`
  );
  return data; // { messages }
}
