/**
 * KnowledgeBasePage — tab-based knowledge base view matching Prototype Image 1.
 *
 * Tabs:
 *  - Overview      — stats summary, recent sources & conversations
 *  - Sources       — full sources table with type filters & search
 *  - Conversations — conversation list with search & actions
 *  - Search        — future search within KB (hollow)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import * as knowledgeBaseService from '../services/knowledgeBase.service.js';
import * as workspaceService from '../services/workspace.service.js';
import * as documentService from '../services/document.service.js';
import * as conversationService from '../services/conversation.service.js';
import SourceRow from '../components/sources/SourceRow.jsx';
import SourceStatusBadge from '../components/sources/SourceStatusBadge.jsx';
import AddSourceModal from '../components/sources/AddSourceModal.jsx';
import ContextMenu from '../components/common/ContextMenu.jsx';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal.jsx';
import RenameModal from '../components/common/RenameModal.jsx';

const TERMINAL_STATUSES = ['READY', 'FAILED'];

// ── Icons ────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const { workspaceId, knowledgeBaseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') || 'overview';

  const [kb, setKb] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreatingConv, setIsCreatingConv] = useState(false);

  // Modals state
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameType, setRenameType] = useState(null); // 'conversation' | 'document'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'conversation' | 'document'

  // Filter & Search states
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL' | 'DOCUMENTS' | 'URLS' | 'CODE' | 'REPOSITORIES'
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');
  const [convSearchQuery, setConvSearchQuery] = useState('');

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
      } catch {
        /* silent */
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, isLoading, knowledgeBaseId]);

  function setTab(t) {
    setSearchParams({ tab: t }, { replace: true });
  }

  async function handleCreateConversation() {
    setIsCreatingConv(true);
    try {
      const data = await conversationService.createConversation(knowledgeBaseId);
      navigate(
        `/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}/conversations/${data.conversation.id}`
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create conversation.');
    } finally {
      setIsCreatingConv(false);
    }
  }

  async function handleRename(newName) {
    try {
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
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to rename item.');
    } finally {
      setRenameTarget(null);
      setRenameType(null);
    }
  }

  async function handleDelete() {
    try {
      if (deleteType === 'conversation') {
        await conversationService.deleteConversation(knowledgeBaseId, deleteTarget.id);
        setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      } else if (deleteType === 'document') {
        await documentService.deleteDocument(knowledgeBaseId, deleteTarget.id);
        setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete item.');
    } finally {
      setDeleteTarget(null);
      setDeleteType(null);
    }
  }

  async function handleDownload(doc) {
    try {
      await documentService.downloadDocument(
        knowledgeBaseId,
        doc.id,
        doc.name || doc.original_filename
      );
    } catch {
      setError('Failed to download document.');
    }
  }

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    let result = documents;
    if (sourceFilter === 'URLS' || sourceFilter === 'CODE' || sourceFilter === 'REPOSITORIES') {
      return []; // Future source types
    }
    if (sourceSearchQuery.trim()) {
      const q = sourceSearchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          (d.name || '').toLowerCase().includes(q) ||
          (d.original_filename || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [documents, sourceFilter, sourceSearchQuery]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!convSearchQuery.trim()) return conversations;
    const q = convSearchQuery.toLowerCase();
    return conversations.filter(
      (c) => (c.title || `Conversation #${c.id}`).toLowerCase().includes(q)
    );
  }, [conversations, convSearchQuery]);

  // Stats calculation
  const totalCount = documents.length;
  const processedCount = documents.filter((d) => d.status === 'READY').length;
  const processingCount = documents.filter((d) => d.status === 'PROCESSING' || d.status === 'UPLOADED').length;
  const failedCount = documents.filter((d) => d.status === 'FAILED').length;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'sources', label: 'Sources', badge: documents.length },
    { key: 'conversations', label: 'Conversations', badge: conversations.length },
    { key: 'search', label: 'Search' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header & Tabs */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          <Link to="/home" className="hover:underline" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            RecallAI
          </Link>
          <span>/</span>
          <Link to="/home" className="hover:underline" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Workspaces
          </Link>
          <span>/</span>
          <Link
            to={`/workspaces/${workspaceId}`}
            className="hover:underline"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            {workspace?.name || 'Workspace'}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{kb?.name || '…'}</span>
        </div>

        {/* KB Identity & Primary Action */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            {isLoading ? (
              <>
                <div className="skeleton h-6 w-56 mb-2" />
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddSourceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            >
              <PlusIcon />
              Add Source
            </button>
            <button
              onClick={handleCreateConversation}
              disabled={isCreatingConv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium cursor-pointer border"
              style={{
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-elevated)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <ChatIcon />
              New Conversation
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center border-b" style={{ borderColor: 'var(--border-default)' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-3 text-sm cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-2"
              style={{
                borderBottomColor: activeTab === t.key ? 'var(--accent)' : 'transparent',
                color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: 'transparent',
                fontWeight: activeTab === t.key ? '500' : '400',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== t.key) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== t.key) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {t.label}
              {t.badge !== undefined && (
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded font-mono"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: activeTab === t.key ? 'var(--accent-text)' : 'var(--text-muted)',
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 md:mx-8 mt-4 text-sm px-4 py-3 rounded border"
          style={{
            color: 'var(--status-error)',
            backgroundColor: 'rgba(239,68,68,0.07)',
            borderColor: 'rgba(239,68,68,0.18)',
          }}
        >
          {error}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-auto px-6 md:px-8 py-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8 max-w-5xl">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{totalCount}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Total Sources</p>
              </div>
              <div className="p-4 rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <p className="text-2xl font-semibold" style={{ color: 'var(--status-success)' }}>{processedCount}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Processed</p>
              </div>
              <div className="p-4 rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <p className="text-2xl font-semibold" style={{ color: 'var(--status-warning)' }}>{processingCount}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Processing</p>
              </div>
              <div className="p-4 rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <p className="text-2xl font-semibold" style={{ color: 'var(--status-error)' }}>{failedCount}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Failed</p>
              </div>
            </div>

            {/* Recent Sources section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Sources</h3>
                <button
                  onClick={() => setTab('sources')}
                  className="text-xs hover:underline cursor-pointer flex items-center gap-1"
                  style={{ color: 'var(--accent-text)', backgroundColor: 'transparent' }}
                >
                  View all →
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="p-6 text-center rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No sources yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {documents.slice(0, 4).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded border"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileIcon />
                        <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {doc.name || doc.original_filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <SourceStatusBadge status={doc.status} />
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Conversations section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Conversations</h3>
                <button
                  onClick={() => setTab('conversations')}
                  className="text-xs hover:underline cursor-pointer flex items-center gap-1"
                  style={{ color: 'var(--accent-text)', backgroundColor: 'transparent' }}
                >
                  View all →
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="p-6 text-center rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No conversations yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {conversations.slice(0, 4).map((c) => (
                    <Link
                      key={c.id}
                      to={`/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}/conversations/${c.id}`}
                      className="flex items-center justify-between p-3 rounded border no-underline transition-colors"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ChatIcon />
                        <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {c.title || `Conversation #${c.id}`}
                        </span>
                      </div>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(c.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SOURCES */}
        {activeTab === 'sources' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Sources
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Manage all knowledge sources in this knowledge base.
                </p>
              </div>
              <button
                onClick={() => setShowAddSourceModal(true)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <PlusIcon />
                Add Source
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[
                { key: 'ALL', label: 'All', count: documents.length },
                { key: 'DOCUMENTS', label: 'Documents', count: documents.length },
                { key: 'URLS', label: 'URLs', count: 0 },
                { key: 'CODE', label: 'Code', count: 0 },
                { key: 'REPOSITORIES', label: 'Repositories', count: 0 },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSourceFilter(f.key)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                  style={{
                    backgroundColor: sourceFilter === f.key ? 'var(--nav-active-bg)' : 'var(--bg-surface)',
                    color: sourceFilter === f.key ? 'var(--accent-text)' : 'var(--text-secondary)',
                    border: `1px solid ${sourceFilter === f.key ? 'var(--accent-border)' : 'var(--border-default)'}`,
                  }}
                >
                  {f.label}
                  <span className="text-[10px] font-mono opacity-80">{f.count}</span>
                </button>
              ))}
            </div>

            {/* Search sources bar */}
            <div className="relative mb-4 max-w-md">
              <span className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                value={sourceSearchQuery}
                onChange={(e) => setSourceSearchQuery(e.target.value)}
                placeholder="Search sources..."
                className="w-full pl-9 pr-3 py-1.5 rounded text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Sources Table */}
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-16 rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {sourceFilter !== 'ALL' && sourceFilter !== 'DOCUMENTS'
                    ? `${sourceFilter} ingestion is coming soon`
                    : 'No sources found'}
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  {sourceFilter !== 'ALL' && sourceFilter !== 'DOCUMENTS'
                    ? 'RecallAI will soon support URLs, code files, and repository sources.'
                    : 'Add a source from a conversation to get started.'}
                </p>
                {(sourceFilter === 'ALL' || sourceFilter === 'DOCUMENTS') && (
                  <button
                    onClick={() => setShowAddSourceModal(true)}
                    className="px-3 py-1.5 rounded text-xs font-medium text-white cursor-pointer"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    Add Source
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--border-default)' }}>
                <table className="w-full text-left border-collapse" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <thead>
                    <tr className="border-b text-[11px] uppercase tracking-wider font-semibold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Added</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <SourceRow
                        key={doc.id}
                        source={doc}
                        onRename={(d) => {
                          setRenameTarget(d);
                          setRenameType('document');
                        }}
                        onDelete={(d) => {
                          setDeleteTarget(d);
                          setDeleteType('document');
                        }}
                        onDownload={handleDownload}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONVERSATIONS */}
        {activeTab === 'conversations' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Conversations
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Chat and explore knowledge with contextual RAG.
                </p>
              </div>
              <button
                onClick={handleCreateConversation}
                disabled={isCreatingConv}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <PlusIcon />
                {isCreatingConv ? 'Creating…' : 'New Conversation'}
              </button>
            </div>

            {/* Search conversations */}
            <div className="relative mb-4 max-w-md">
              <span className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                value={convSearchQuery}
                onChange={(e) => setConvSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-1.5 rounded text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            {filteredConversations.length === 0 ? (
              <div className="text-center py-16 rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No conversations found</p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Start a new conversation to explore and chat with your sources.
                </p>
                <button
                  onClick={handleCreateConversation}
                  className="px-3 py-1.5 rounded text-xs font-medium text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Create Conversation
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-3.5 rounded border transition-colors"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  >
                    <Link
                      to={`/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}/conversations/${conv.id}`}
                      className="flex items-center gap-3 min-w-0 flex-1 no-underline"
                    >
                      <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                        <ChatIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {conv.title || `Conversation #${conv.id}`}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(conv.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                      <ContextMenu
                        items={[
                          {
                            label: 'Rename',
                            onClick: () => {
                              setRenameTarget(conv);
                              setRenameType('conversation');
                            },
                          },
                          {
                            label: 'Delete',
                            onClick: () => {
                              setDeleteTarget(conv);
                              setDeleteType('conversation');
                            },
                            danger: true,
                          },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SEARCH */}
        {activeTab === 'search' && (
          <div className="text-center py-20">
            <div
              className="w-10 h-10 rounded mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <SearchIcon />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Search in this Knowledge Base
            </p>
            <p className="text-xs max-w-sm mx-auto mb-4" style={{ color: 'var(--text-secondary)' }}>
              Deep semantic search across all sources and conversations in this knowledge base is coming soon.
            </p>
            <span
              className="inline-block text-xs px-2.5 py-1 rounded"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-default)',
              }}
            >
              Coming soon
            </span>
          </div>
        )}
      </div>

      {/* Add Source Modal */}
      {showAddSourceModal && (
        <AddSourceModal
          workspaceId={workspaceId}
          knowledgeBaseId={knowledgeBaseId}
          conversations={conversations}
          onCreateConversation={handleCreateConversation}
          onClose={() => setShowAddSourceModal(false)}
        />
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <RenameModal
          title={renameType === 'conversation' ? 'Rename Conversation' : 'Rename Document'}
          currentName={renameTarget.title || renameTarget.name || renameTarget.original_filename || ''}
          onRename={handleRename}
          onClose={() => {
            setRenameTarget(null);
            setRenameType(null);
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={deleteType === 'conversation' ? 'Delete Conversation' : 'Delete Document'}
          message={`Are you sure you want to delete "${
            deleteTarget.title || deleteTarget.name || deleteTarget.original_filename
          }"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteType(null);
          }}
        />
      )}
    </div>
  );
}
