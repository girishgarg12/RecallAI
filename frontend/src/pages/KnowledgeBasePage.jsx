/**
 * KnowledgeBasePage — shows documents and conversations for a knowledge base.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import * as knowledgeBaseService from '../services/knowledgeBase.service.js';
import * as workspaceService from '../services/workspace.service.js';
import * as documentService from '../services/document.service.js';
import * as conversationService from '../services/conversation.service.js';
import DocumentStatusBadge from '../components/DocumentStatusBadge.jsx';
import ContextMenu from '../components/common/ContextMenu.jsx';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal.jsx';
import RenameModal from '../components/common/RenameModal.jsx';

const TERMINAL_STATUSES = ['READY', 'FAILED'];

export default function KnowledgeBasePage() {
  const { workspaceId, knowledgeBaseId } = useParams();
  const navigate = useNavigate();

  const [kb, setKb] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations');

  // CRUD modal state
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameType, setRenameType] = useState(null); // 'conversation' | 'document'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'conversation' | 'document'

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [kbData, wsData, docsData, convsData] = await Promise.all([
        knowledgeBaseService.getKnowledgeBaseById(knowledgeBaseId),
        workspaceService.getWorkspaceById(workspaceId),
        documentService.getDocuments(knowledgeBaseId),
        conversationService.getConversations(knowledgeBaseId),
      ]);
      setKb(kbData);
      setWorkspace(wsData);
      setDocuments(docsData?.documents || []);
      setConversations(convsData?.conversations || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load knowledge base.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, knowledgeBaseId]);

  useEffect(() => {
    load();
  }, [load]);

  // Document status polling
  useEffect(() => {
    const hasNonTerminal = documents.some((d) => !TERMINAL_STATUSES.includes(d.status));
    if (!hasNonTerminal || isLoading) return;

    const interval = setInterval(async () => {
      try {
        const docsData = await documentService.getDocuments(knowledgeBaseId);
        const updated = docsData?.documents || [];
        setDocuments(updated);
        if (updated.every((d) => TERMINAL_STATUSES.includes(d.status))) {
          clearInterval(interval);
        }
      } catch { /* silent */ }
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, isLoading, knowledgeBaseId]);

  async function handleCreateConversation() {
    setIsCreatingConv(true);
    try {
      const data = await conversationService.createConversation(knowledgeBaseId);
      navigate(
        `/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}/conversations/${data.conversation.id}`
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create conversation.');
      setIsCreatingConv(false);
    }
  }

  // CRUD handlers
  async function handleRename(newName) {
    if (renameType === 'conversation') {
      const result = await conversationService.renameConversation(knowledgeBaseId, renameTarget.id, newName);
      setConversations((prev) =>
        prev.map((c) => (c.id === renameTarget.id ? { ...c, ...result.conversation } : c))
      );
    } else if (renameType === 'document') {
      const result = await documentService.updateDocument(knowledgeBaseId, renameTarget.id, newName);
      setDocuments((prev) =>
        prev.map((d) => (d.id === renameTarget.id ? { ...d, ...result.document } : d))
      );
    }
    setRenameTarget(null);
    setRenameType(null);
  }

  async function handleDelete() {
    if (deleteType === 'conversation') {
      await conversationService.deleteConversation(knowledgeBaseId, deleteTarget.id);
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } else if (deleteType === 'document') {
      await documentService.deleteDocument(knowledgeBaseId, deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
    setDeleteType(null);
  }

  async function handleDownload(doc) {
    try {
      await documentService.downloadDocument(knowledgeBaseId, doc.id, doc.name || doc.original_filename);
    } catch {
      setError('Failed to download document.');
    }
  }

  const breadcrumbs = [
    { label: 'Workspaces', href: '/dashboard' },
    { label: workspace?.name || 'Workspace', href: `/workspaces/${workspaceId}` },
    { label: kb?.name || 'Knowledge Base' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0">
          {isLoading ? (
            <>
              <div className="skeleton h-5 w-56 mb-2" />
              <div className="skeleton h-3 w-72" />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {kb?.name}
              </h1>
              {kb?.description && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {kb.description}
                </p>
              )}
            </>
          )}
        </div>

        <button
          id="create-conversation-btn"
          onClick={handleCreateConversation}
          disabled={isLoading || isCreatingConv}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded text-sm font-medium text-white cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
          onMouseEnter={(e) => !(isLoading || isCreatingConv) && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          {isCreatingConv ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
              Creating…
            </span>
          ) : (
            <>
              <span className="text-base leading-none">+</span>
              New Conversation
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-6 text-sm px-4 py-3 rounded border"
          style={{
            color: 'var(--status-error)',
            backgroundColor: 'rgba(239,68,68,0.07)',
            borderColor: 'rgba(239,68,68,0.18)',
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {['conversations', 'documents'].map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className="pb-3 px-1 text-sm font-medium capitalize border-b-2 cursor-pointer"
            style={{
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderColor: activeTab === tab ? 'var(--accent)' : 'transparent',
              marginBottom: '-1px',
            }}
          >
            {tab}
            {!isLoading && (
              <span
                className="ml-2 text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                }}
              >
                {tab === 'conversations' ? conversations.length : documents.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'conversations' && (
        <ConversationsTab
          conversations={conversations}
          isLoading={isLoading}
          workspaceId={workspaceId}
          knowledgeBaseId={knowledgeBaseId}
          onCreateConversation={handleCreateConversation}
          isCreating={isCreatingConv}
          onRename={(conv) => { setRenameTarget(conv); setRenameType('conversation'); }}
          onDelete={(conv) => { setDeleteTarget(conv); setDeleteType('conversation'); }}
        />
      )}

      {activeTab === 'documents' && (
        <DocumentsTab
          documents={documents}
          isLoading={isLoading}
          onRename={(doc) => { setRenameTarget(doc); setRenameType('document'); }}
          onDelete={(doc) => { setDeleteTarget(doc); setDeleteType('document'); }}
          onDownload={handleDownload}
        />
      )}

      {/* Rename modal */}
      {renameTarget && (
        <RenameModal
          title={renameType === 'conversation' ? 'Rename Conversation' : 'Rename Document'}
          currentName={renameTarget.name || renameTarget.title || renameTarget.original_filename || ''}
          onRename={handleRename}
          onClose={() => { setRenameTarget(null); setRenameType(null); }}
        />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={deleteType === 'conversation' ? 'Delete Conversation' : 'Delete Document'}
          message={`Are you sure you want to delete "${deleteTarget.name || deleteTarget.title || deleteTarget.original_filename}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => { setDeleteTarget(null); setDeleteType(null); }}
        />
      )}
    </AppLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────

function ConversationsTab({ conversations, isLoading, workspaceId, knowledgeBaseId, onCreateConversation, isCreating, onRename, onDelete }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <div className="skeleton h-4 w-48 mb-2" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div
        className="text-center py-16 rounded border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <div
          className="w-10 h-10 rounded mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No conversations yet</p>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Start a conversation to upload documents and ask questions.
        </p>
        <button
          onClick={onCreateConversation}
          disabled={isCreating}
          className="px-3.5 py-2 rounded text-sm font-medium text-white cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {isCreating ? 'Creating…' : 'New conversation'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          to={`/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}/conversations/${conv.id}`}
          className="flex items-center justify-between p-4 rounded border animate-slide-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {conv.title || `Conversation #${conv.id}`}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(conv.updated_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ContextMenu
              items={[
                { label: 'Rename', onClick: () => onRename(conv) },
                { label: 'Delete', onClick: () => onDelete(conv), danger: true },
              ]}
            />
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}

function DocumentsTab({ documents, isLoading, onRename, onDelete, onDownload }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <div className="skeleton h-4 w-56 mb-2" />
            <div className="skeleton h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div
        className="text-center py-16 rounded border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No documents uploaded</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Documents are uploaded within conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 rounded border animate-slide-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {doc.name || doc.original_filename}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {doc.mime_type}{doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DocumentStatusBadge status={doc.status} />
            <ContextMenu
              items={[
                { label: 'Rename', onClick: () => onRename(doc) },
                ...(doc.status === 'READY' ? [{ label: 'Download', onClick: () => onDownload(doc) }] : []),
                { label: 'Delete', onClick: () => onDelete(doc), danger: true },
              ]}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
