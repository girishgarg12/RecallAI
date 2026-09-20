/**
 * ConversationPage — ChatGPT-style conversation interface matching Prototype Image 2.
 *
 * Layout:
 *  - Header: Breadcrumb, Title with rename pencil, Share button, More actions
 *  - Main chat message stream
 *  - Slide-over SourcesPanel on right
 *  - Composer at bottom with scope selector & file upload
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as conversationService from '../services/conversation.service.js';
import * as messageService from '../services/message.service.js';
import * as documentService from '../services/document.service.js';
import * as workspaceService from '../services/workspace.service.js';
import * as knowledgeBaseService from '../services/knowledgeBase.service.js';
import MessageBubble from '../components/chat/MessageBubble.jsx';
import Composer from '../components/chat/Composer.jsx';
import SourcesPanel from '../components/chat/SourcesPanel.jsx';
import AddSourceModal from '../components/sources/AddSourceModal.jsx';
import ContextMenu from '../components/common/ContextMenu.jsx';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal.jsx';
import RenameModal from '../components/common/RenameModal.jsx';
import { addRecentConversation, removeRecentConversation } from '../utils/recentConversations.js';

const TERMINAL_STATUSES = ['READY', 'FAILED'];

function EditPencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export default function ConversationPage() {
  const { workspaceId, knowledgeBaseId, conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [kb, setKb] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat input & sending state
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // Scope state
  const [scope, setScope] = useState('CONVERSATION');
  const [selectedSourceId, setSelectedSourceId] = useState('');

  // Sources drawer state
  const [sourcesPanelOpen, setSourcesPanelOpen] = useState(false);
  const [focusedSources, setFocusedSources] = useState(null);

  // Modals & UI state
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);

  // Load conversation data
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
      const conv = convData?.conversation;
      setConversation(conv);
      setMessages(msgsData?.messages || []);
      const docs = docsData?.documents || [];
      setDocuments(docs);

      // Record in recent conversations
      if (conv) {
        addRecentConversation({
          conversationId,
          knowledgeBaseId,
          workspaceId,
          title: conv.title || `Conversation #${conversationId}`,
        });
      }

      // Initialize selectedSourceId
      if (conv?.active_source_id) {
        setSelectedSourceId(String(conv.active_source_id));
      } else {
        const firstReady = docs.find((d) => d.status === 'READY');
        if (firstReady) {
          setSelectedSourceId(String(firstReady.id));
        } else if (docs.length > 0) {
          setSelectedSourceId(String(docs[0].id));
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load conversation.');
      if (err?.response?.status === 404) {
        removeRecentConversation(conversationId);
      }
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, knowledgeBaseId, conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-trigger upload if ?upload=true is passed
  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setSourcesPanelOpen(true);
    }
  }, [searchParams]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Document status polling
  useEffect(() => {
    const hasNonTerminal = documents.some((d) => !TERMINAL_STATUSES.includes(d.status));
    if (!hasNonTerminal || isLoading) return;

    const interval = setInterval(async () => {
      try {
        const docsData = await documentService.getConversationDocuments(knowledgeBaseId, conversationId);
        const updated = docsData?.documents || [];
        setDocuments(updated);

        setSelectedSourceId((prev) => {
          if (prev && updated.some((d) => String(d.id) === String(prev))) return prev;
          const firstReady = updated.find((d) => d.status === 'READY');
          return firstReady ? String(firstReady.id) : (updated[0] ? String(updated[0].id) : '');
        });

        if (updated.every((d) => TERMINAL_STATUSES.includes(d.status))) {
          clearInterval(interval);
        }
      } catch {
        /* silent */
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, isLoading, knowledgeBaseId, conversationId]);

  // Upload handler
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setSendError('');
    try {
      const result = await documentService.uploadDocument(knowledgeBaseId, conversationId, file);
      setDocuments((prev) => [result.document, ...prev]);
      if (result.document?.id) {
        setSelectedSourceId(String(result.document.id));
      }
      setSourcesPanelOpen(true);
    } catch (err) {
      setSendError(err?.response?.data?.message || 'Upload failed. Accepted: PDF, DOCX, TXT, MD');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  // Download handler
  async function handleDownload(doc) {
    try {
      await documentService.downloadDocument(
        knowledgeBaseId,
        doc.id,
        doc.name || doc.original_filename
      );
    } catch {
      setSendError('Failed to download document.');
    }
  }

  // Rename conversation
  async function handleRename(newTitle) {
    try {
      const result = await conversationService.renameConversation(knowledgeBaseId, conversationId, newTitle);
      setConversation(result.conversation);
      addRecentConversation({
        conversationId,
        knowledgeBaseId,
        workspaceId,
        title: result.conversation.title,
      });
    } catch (err) {
      setSendError(err?.response?.data?.message || 'Failed to rename conversation.');
    } finally {
      setShowRenameModal(false);
    }
  }

  // Delete conversation
  async function handleDelete() {
    try {
      await conversationService.deleteConversation(knowledgeBaseId, conversationId);
      removeRecentConversation(conversationId);
      navigate(`/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}?tab=conversations`);
    } catch (err) {
      setSendError(err?.response?.data?.message || 'Failed to delete conversation.');
      setShowDeleteModal(false);
    }
  }

  // Share conversation action
  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  }

  // Send message
  async function handleSend(e) {
    e?.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setSendError('');

    // Pre-flight check for SOURCE scope
    let effectiveSourceId = selectedSourceId;
    if (scope === 'SOURCE') {
      if (!effectiveSourceId) {
        const active = conversation?.active_source_id;
        const firstReady = documents.find((d) => d.status === 'READY')?.id;
        const fallback = active || firstReady || documents[0]?.id;
        if (fallback) {
          effectiveSourceId = String(fallback);
          setSelectedSourceId(effectiveSourceId);
        }
      }

      if (!effectiveSourceId) {
        setSendError('Please upload and select a document to query with Current Source scope.');
        return;
      }
    }

    setIsSending(true);
    setInput('');

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
      if (scope === 'SOURCE') {
        payload.sourceId = Number(effectiveSourceId);
      }
      const result = await messageService.sendMessage(knowledgeBaseId, conversationId, payload);

      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => !m.optimistic);
        return result.assistantMessage
          ? [...withoutOptimistic, result.userMessage, { ...result.assistantMessage, sources: result.sources || [] }]
          : [...withoutOptimistic, result.userMessage];
      });

      // Refresh documents list
      documentService.getConversationDocuments(knowledgeBaseId, conversationId)
        .then((data) => setDocuments(data?.documents || []))
        .catch(() => {});
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m.optimistic));
      setInput(content);
      setSendError(err?.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  }

  const readyDocs = documents.filter((d) => d.status === 'READY');

  const formattedDate = conversation?.created_at
    ? new Date(conversation.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Conversation Stream */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <header
          className="h-14 shrink-0 px-6 border-b flex items-center justify-between gap-4 z-10"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          {/* Left info: Breadcrumb & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                <Link to={`/workspaces/${workspaceId}`} className="hover:underline" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  {workspace?.name || 'Workspace'}
                </Link>
                <span>&gt;</span>
                <Link to={`/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}`} className="hover:underline" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  {kb?.name || 'Knowledge Base'}
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {conversation?.title || `Conversation #${conversationId}`}
                </h1>
                <button
                  onClick={() => setShowRenameModal(true)}
                  className="p-1 rounded cursor-pointer transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Rename conversation"
                >
                  <EditPencilIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {shareToast && (
              <span className="text-xs px-2.5 py-1 rounded-md" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                Link copied to clipboard!
              </span>
            )}

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer border transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <ShareIcon />
              <span>Share</span>
            </button>

            <ContextMenu
              items={[
                { label: 'Rename conversation', onClick: () => setShowRenameModal(true) },
                { label: 'Delete conversation', onClick: () => setShowDeleteModal(true), danger: true },
              ]}
            />
          </div>
        </header>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col">
          {/* Top Date Separator */}
          {formattedDate && (
            <div className="flex items-center justify-center my-4">
              <span
                className="text-[11px] px-3 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {formattedDate}
              </span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <span className="font-bold text-base" style={{ color: 'var(--accent-text)' }}>R</span>
              </div>
              <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Ask anything about your knowledge
              </h2>
              <p className="text-xs max-w-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                RecallAI retrieves relevant chunks from your documents and generates context-grounded answers.
              </p>
              {documents.length === 0 && (
                <button
                  onClick={() => setShowAddSourceModal(true)}
                  className="px-3.5 py-2 rounded text-xs font-medium text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Upload your first document
                </button>
              )}
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onOpenSources={(sources) => {
                setFocusedSources(sources);
                setSourcesPanelOpen(true);
              }}
            />
          ))}

          {/* Sending / Thinking Indicator */}
          {isSending && (
            <div className="flex items-start gap-3.5 animate-fade-in my-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                R
              </div>
              <div
                className="px-4 py-3 rounded-xl flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ color: 'var(--accent-text)' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.15s]" style={{ color: 'var(--accent-text)' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.3s]" style={{ color: 'var(--accent-text)' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Alert if any */}
        {sendError && (
          <div className="mx-6 mb-2 text-xs px-3.5 py-2 rounded-lg border flex items-center justify-between"
            style={{
              color: 'var(--status-error)',
              backgroundColor: 'rgba(239,68,68,0.08)',
              borderColor: 'rgba(239,68,68,0.2)',
            }}
          >
            <span>{sendError}</span>
            <button onClick={() => setSendError('')} className="underline cursor-pointer ml-2">Dismiss</button>
          </div>
        )}

        {/* Bottom Composer */}
        <div className="px-4 sm:px-8 pb-5 pt-2">
          <div className="max-w-4xl mx-auto">
            <Composer
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isSending={isSending}
              scope={scope}
              onScopeChange={setScope}
              selectedSourceId={selectedSourceId}
              onSourceChange={setSelectedSourceId}
              readyDocs={readyDocs}
              documents={documents}
              isUploading={isUploading}
              onFileUpload={handleFileUpload}
              onToggleSourcesPanel={() => {
                setFocusedSources(null);
                setSourcesPanelOpen((prev) => !prev);
              }}
              sourcesPanelOpen={sourcesPanelOpen}
            />
          </div>
        </div>
      </div>

      {/* Slide-over Right Sources Panel */}
      <SourcesPanel
        isOpen={sourcesPanelOpen}
        onClose={() => setSourcesPanelOpen(false)}
        documents={documents}
        focusedSources={focusedSources}
        onDownload={handleDownload}
        onUploadClick={() => setShowAddSourceModal(true)}
      />

      {/* Add Source Modal */}
      {showAddSourceModal && (
        <AddSourceModal
          workspaceId={workspaceId}
          knowledgeBaseId={knowledgeBaseId}
          conversations={[{ id: conversationId, title: conversation?.title }]}
          onClose={() => setShowAddSourceModal(false)}
        />
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <RenameModal
          title="Rename Conversation"
          currentName={conversation?.title || ''}
          onRename={handleRename}
          onClose={() => setShowRenameModal(false)}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Delete Conversation"
          message={`Are you sure you want to delete "${conversation?.title || `Conversation #${conversationId}`}"? All messages and attachments will be permanently removed.`}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
