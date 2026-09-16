/**
 * KnowledgeBasePage
 *
 * Shows:
 * - Knowledge base details
 * - All documents in this KB (GET /knowledge-bases/:kbId/documents)
 * - List of conversations (GET /knowledge-bases/:kbId/conversations)
 * - Upload document button (linked to a conversation)
 * - Create new conversation button
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import * as knowledgeBaseService from '../services/knowledgeBase.service.js';
import * as workspaceService from '../services/workspace.service.js';
import * as documentService from '../services/document.service.js';
import * as conversationService from '../services/conversation.service.js';
import DocumentStatusBadge from '../components/DocumentStatusBadge.jsx';

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
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' | 'documents'

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

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
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
              <div className="skeleton h-6 w-56 mb-2" />
              <div className="skeleton h-4 w-72" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {kb?.name}
              </h1>
              {kb?.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
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
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--purple-600)' }}
          onMouseEnter={(e) => !(isLoading || isCreatingConv) && (e.currentTarget.style.backgroundColor = 'var(--purple-700)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--purple-600)')}
        >
          {isCreatingConv ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
              Creating…
            </span>
          ) : (
            <>
              <span className="text-lg leading-none">+</span>
              New Conversation
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-6 text-sm px-4 py-3 rounded-lg border"
          style={{
            color: 'var(--status-error)',
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderColor: 'rgba(239,68,68,0.2)',
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
            className="pb-3 px-1 text-sm font-medium capitalize border-b-2 transition-colors cursor-pointer"
            style={{
              color: activeTab === tab ? 'var(--purple-400)' : 'var(--text-secondary)',
              borderColor: activeTab === tab ? 'var(--purple-500)' : 'transparent',
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
        />
      )}

      {activeTab === 'documents' && (
        <DocumentsTab
          documents={documents}
          isLoading={isLoading}
          knowledgeBaseId={knowledgeBaseId}
          onRefresh={load}
        />
      )}
    </AppLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConversationsTab({ conversations, isLoading, workspaceId, knowledgeBaseId, onCreateConversation, isCreating }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg p-4 border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
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
        className="text-center py-16 rounded-xl border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
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
          className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--purple-600)' }}
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
          className="flex items-center justify-between p-4 rounded-lg border transition-all animate-slide-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--purple-600)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--purple-400)' }}>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

function DocumentsTab({ documents, isLoading, knowledgeBaseId, onRefresh }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg p-4 border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
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
        className="text-center py-16 rounded-xl border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No documents uploaded</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Documents are uploaded within conversations. Open a conversation and upload a file to start.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 rounded-lg border animate-slide-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {doc.name || doc.original_filename}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {doc.mime_type} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          </div>
          <DocumentStatusBadge status={doc.status} />
        </div>
      ))}
    </div>
  );
}
