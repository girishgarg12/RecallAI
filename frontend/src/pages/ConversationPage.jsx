/**
 * ConversationPage — the main RAG chat interface.
 *
 * Features:
 * - Sidebar: conversation documents + upload new document
 * - Main panel: message history + chat input
 * - Retrieval scope selector: SOURCE | CONVERSATION | KNOWLEDGE_BASE
 * - Displays sources returned with each AI response
 * - Auto-scrolls to latest message
 *
 * Backend integration notes:
 * - Documents are uploaded to /knowledge-bases/:kbId/conversations/:convId/documents
 * - Messages sent to /knowledge-bases/:kbId/conversations/:convId/messages
 * - Response: { userMessage, assistantMessage, sources: [{ id, name }] }
 * - scope defaults to active_source_id if omitted
 * - scope "SOURCE" requires sourceId param
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import * as conversationService from '../services/conversation.service.js';
import * as messageService from '../services/message.service.js';
import * as documentService from '../services/document.service.js';
import * as workspaceService from '../services/workspace.service.js';
import * as knowledgeBaseService from '../services/knowledgeBase.service.js';
import DocumentStatusBadge from '../components/DocumentStatusBadge.jsx';

const SCOPES = [
  { value: 'KNOWLEDGE_BASE', label: 'Knowledge Base', description: 'Search all documents in this KB' },
  { value: 'CONVERSATION', label: 'Conversation', description: 'Search documents in this conversation' },
  { value: 'SOURCE', label: 'Single Source', description: 'Search one specific document' },
];

export default function ConversationPage() {
  const { workspaceId, knowledgeBaseId, conversationId } = useParams();

  const [workspace, setWorkspace] = useState(null);
  const [kb, setKb] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat state
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // Scope state
  const [scope, setScope] = useState('KNOWLEDGE_BASE');
  const [selectedSourceId, setSelectedSourceId] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [wsData, kbData, convData, msgsData, docsData] = await Promise.all([
        workspaceService.getWorkspaceById(workspaceId),
        knowledgeBaseService.getKnowledgeBaseById(knowledgeBaseId),
        conversationService.getConversation(knowledgeBaseId, conversationId),
        messageService.getMessages(knowledgeBaseId, conversationId),
        documentService.getConversationDocuments(knowledgeBaseId, conversationId),
      ]);
      setWorkspace(wsData);
      setKb(kbData);
      setConversation(convData?.conversation);
      setMessages(msgsData?.messages || []);
      setDocuments(docsData?.documents || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load conversation.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, knowledgeBaseId, conversationId]);

  useEffect(() => { load(); }, [load]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file upload
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      const result = await documentService.uploadDocument(knowledgeBaseId, conversationId, file);
      const newDoc = result.document;
      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'Upload failed. Accepted: PDF, DOCX, TXT, MD');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Refresh document status (for polling PROCESSING state)
  async function refreshDocuments() {
    try {
      const docsData = await documentService.getConversationDocuments(knowledgeBaseId, conversationId);
      setDocuments(docsData?.documents || []);
    } catch { /* silent */ }
  }

  // Send message
  async function handleSend(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setSendError('');
    setIsSending(true);
    setInput('');

    // Optimistic: show user message immediately
    const optimisticUserMsg = {
      id: `optimistic-${Date.now()}`,
      role: 'USER',
      content,
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const payload = { content, scope };
      if (scope === 'SOURCE' && selectedSourceId) {
        payload.sourceId = Number(selectedSourceId);
      }

      const result = await messageService.sendMessage(knowledgeBaseId, conversationId, payload);

      // Replace optimistic message + add assistant message + sources
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => !m.optimistic);
        const withSources = result.assistantMessage
          ? [
              ...withoutOptimistic,
              result.userMessage,
              { ...result.assistantMessage, sources: result.sources || [] },
            ]
          : [...withoutOptimistic, result.userMessage];
        return withSources;
      });

      // Refresh docs in case a document status changed
      refreshDocuments();
    } catch (err) {
      // Remove optimistic message and show error
      setMessages((prev) => prev.filter((m) => !m.optimistic));
      setInput(content); // restore input
      setSendError(err?.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }

  // Auto-resize textarea
  function handleInputChange(e) {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: workspace?.name || 'Workspace', href: `/workspaces/${workspaceId}` },
    { label: kb?.name || 'Knowledge Base', href: `/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}` },
    { label: conversation?.title || `Chat #${conversationId}` },
  ];

  const readyDocs = documents.filter((d) => d.status === 'READY');

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--purple-500)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading conversation…</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: 'var(--status-error)' }}>{error}</p>
        </div>
      ) : (
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
          {/* ── Sidebar ── */}
          <aside
            className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
          >
            {/* Documents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Documents
                </span>
                <button
                  id="refresh-docs-btn"
                  onClick={refreshDocuments}
                  className="text-xs cursor-pointer transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.target.style.color = 'var(--purple-400)')}
                  onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
                  title="Refresh document status"
                >
                  ↻
                </button>
              </div>

              {/* Upload button */}
              <div className="mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="doc-upload-input"
                  accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => !isUploading && (e.currentTarget.style.borderColor = 'var(--purple-600)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--purple-400)', borderTopColor: 'transparent' }} />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Document
                    </>
                  )}
                </button>
                {uploadError && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--status-error)' }}>
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Document list */}
              {documents.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  No documents yet. Upload one to start chatting.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2.5 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {doc.name || doc.original_filename}
                        </p>
                      </div>
                      <DocumentStatusBadge status={doc.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Retrieval Scope */}
            <div className="border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Retrieval Scope
              </p>
              <div className="flex flex-col gap-1.5">
                {SCOPES.map((s) => (
                  <button
                    key={s.value}
                    id={`scope-${s.value}`}
                    onClick={() => setScope(s.value)}
                    className="text-left p-2.5 rounded-lg border transition-all cursor-pointer"
                    style={{
                      backgroundColor: scope === s.value ? 'rgba(124,58,237,0.1)' : 'var(--bg-elevated)',
                      borderColor: scope === s.value ? 'var(--purple-600)' : 'var(--border-subtle)',
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: scope === s.value ? 'var(--purple-400)' : 'var(--text-primary)' }}>
                      {s.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {s.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Source selector — shown when scope = SOURCE */}
              {scope === 'SOURCE' && (
                <div className="mt-3">
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Select document
                  </label>
                  {readyDocs.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      No ready documents. Upload and wait for processing.
                    </p>
                  ) : (
                    <select
                      id="source-select"
                      value={selectedSourceId}
                      onChange={(e) => setSelectedSourceId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg text-xs border focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="">— Choose document —</option>
                      {readyDocs.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name || doc.original_filename}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ── Main Chat Panel ── */}
          <div className="flex-1 flex flex-col min-w-0 rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(124,58,237,0.12)' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--purple-400)' }}>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Ask anything about your documents
                  </p>
                  <p className="text-xs mt-2 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                    Upload a document and ask a question. RecallAI will retrieve the most relevant context and generate an answer.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Sending indicator */}
              {isSending && (
                <div className="flex items-center gap-3 animate-fade-in">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(124,58,237,0.12)' }}
                  >
                    <span className="text-xs font-bold" style={{ color: 'var(--purple-400)' }}>AI</span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
                    style={{ backgroundColor: 'var(--bg-elevated)' }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--text-muted)',
                          animation: `pulse ${0.6 + i * 0.15}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Send error */}
            {sendError && (
              <div
                className="mx-6 mb-2 text-xs px-3 py-2 rounded-lg border"
                style={{
                  color: 'var(--status-error)',
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.2)',
                }}
              >
                {sendError}
                <button
                  onClick={() => setSendError('')}
                  className="ml-2 underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Chat input */}
            <div
              className="border-t p-4"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <form onSubmit={handleSend} className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    id="chat-input"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about your documents… (Enter to send, Shift+Enter for newline)"
                    rows={1}
                    className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                      maxHeight: '160px',
                      lineHeight: '1.5',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--purple-500)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                    disabled={isSending}
                  />
                </div>
                <button
                  id="send-message-btn"
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--purple-600)' }}
                  onMouseEnter={(e) => !(isSending || !input.trim()) && (e.currentTarget.style.backgroundColor = 'var(--purple-700)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--purple-600)')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Scope: <strong style={{ color: 'var(--purple-400)' }}>{scope}</strong>
                {scope === 'SOURCE' && selectedSourceId && (
                  <> · Source: <strong style={{ color: 'var(--blue-400)' }}>
                    {documents.find(d => String(d.id) === String(selectedSourceId))?.name || selectedSourceId}
                  </strong></>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isUser = message.role === 'USER';

  return (
    <div className={`flex items-start gap-3 animate-message ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
        style={{
          backgroundColor: isUser ? 'var(--purple-700)' : 'rgba(124,58,237,0.12)',
          color: isUser ? 'var(--purple-100)' : 'var(--purple-400)',
        }}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            backgroundColor: isUser ? 'var(--purple-700)' : 'var(--bg-elevated)',
            color: isUser ? 'white' : 'var(--text-primary)',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            opacity: message.optimistic ? 0.6 : 1,
          }}
        >
          {message.content}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sources:</span>
            {message.sources.map((src) => (
              <span
                key={src.id}
                className="text-xs px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: 'rgba(59,130,246,0.08)',
                  borderColor: 'rgba(59,130,246,0.2)',
                  color: 'var(--blue-400)',
                }}
              >
                {src.name}
              </span>
            ))}
          </div>
        )}

        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {message.created_at
            ? new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : ''}
        </span>
      </div>
    </div>
  );
}
