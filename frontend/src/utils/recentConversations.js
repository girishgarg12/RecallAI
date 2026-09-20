/**
 * Recent conversations — localStorage-based client-side navigation history.
 *
 * Stores only lightweight metadata (never message content, never tokens).
 * Backend remains the source of truth for all conversation data.
 * If a conversation is no longer accessible it should be removed from this list.
 *
 * Shape: { conversationId, knowledgeBaseId, workspaceId, title, lastVisitedAt }
 */

const KEY = 'recallai_recent_conversations';
const MAX = 5;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** Return the last MAX visited conversations, newest first. */
export function getRecentConversations() {
  return read();
}

/**
 * Add or update a conversation entry. Call this when a conversation is opened.
 * @param {{ conversationId, knowledgeBaseId, workspaceId, title }} entry
 */
export function addRecentConversation({ conversationId, knowledgeBaseId, workspaceId, title }) {
  const list = read();
  const entry = {
    conversationId: String(conversationId),
    knowledgeBaseId: String(knowledgeBaseId),
    workspaceId: String(workspaceId),
    title: title || 'Untitled conversation',
    lastVisitedAt: new Date().toISOString(),
  };
  // Remove existing entry for same conversation, then prepend
  const filtered = list.filter((c) => c.conversationId !== entry.conversationId);
  write([entry, ...filtered].slice(0, MAX));
}

/**
 * Remove a specific conversation from recent history.
 * Call this when a conversation is detected as inaccessible (404/403).
 */
export function removeRecentConversation(conversationId) {
  const list = read();
  write(list.filter((c) => c.conversationId !== String(conversationId)));
}

/** Update the title of an existing recent entry (e.g. after rename). */
export function updateRecentConversationTitle(conversationId, title) {
  const list = read();
  write(list.map((c) =>
    c.conversationId === String(conversationId) ? { ...c, title } : c
  ));
}
