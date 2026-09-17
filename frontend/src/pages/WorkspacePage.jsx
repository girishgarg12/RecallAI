/**
 * WorkspacePage — shows a workspace's knowledge bases.
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import * as workspaceService from '../services/workspace.service.js';
import * as knowledgeBaseService from '../services/knowledgeBase.service.js';
import CreateKnowledgeBaseModal from '../components/CreateKnowledgeBaseModal.jsx';
import ContextMenu from '../components/common/ContextMenu.jsx';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal.jsx';
import RenameModal from '../components/common/RenameModal.jsx';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // CRUD modal state
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    load();
  }, [workspaceId]);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const [ws, kbs] = await Promise.all([
        workspaceService.getWorkspaceById(workspaceId),
        knowledgeBaseService.getKnowledgeBasesByWorkspace(workspaceId),
      ]);
      setWorkspace(ws);
      setKnowledgeBases(Array.isArray(kbs) ? kbs : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load workspace.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKbCreated(newKb) {
    setKnowledgeBases((prev) => [newKb, ...prev]);
    setShowCreate(false);
  }

  async function handleRename(newName) {
    const updated = await knowledgeBaseService.patchKnowledgeBase(renameTarget.id, { name: newName });
    setKnowledgeBases((prev) =>
      prev.map((kb) => (kb.id === renameTarget.id ? { ...kb, ...updated } : kb))
    );
    setRenameTarget(null);
  }

  async function handleDelete() {
    await knowledgeBaseService.deleteKnowledgeBase(deleteTarget.id);
    setKnowledgeBases((prev) => prev.filter((kb) => kb.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const breadcrumbs = [
    { label: 'Workspaces', href: '/dashboard' },
    { label: workspace?.name || 'Workspace' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="min-w-0">
          {isLoading ? (
            <>
              <div className="skeleton h-5 w-48 mb-2" />
              <div className="skeleton h-3 w-64" />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {workspace?.name || 'Workspace'}
              </h1>
              {workspace?.description && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {workspace.description}
                </p>
              )}
            </>
          )}
        </div>
        <button
          id="create-kb-btn"
          onClick={() => setShowCreate(true)}
          disabled={isLoading}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded text-sm font-medium text-white cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
          onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          <span className="text-base leading-none">+</span>
          New Knowledge Base
        </button>
      </div>

      {/* Section label */}
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
        Knowledge Bases
      </h2>

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

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded border p-5"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
            >
              <div className="skeleton h-4 w-3/4 mb-3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && knowledgeBases.length === 0 && (
        <div
          className="text-center py-20 rounded border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          <div
            className="w-10 h-10 rounded mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            No knowledge bases yet
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Create a knowledge base to start uploading documents.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3.5 py-2 rounded text-sm font-medium text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          >
            Create knowledge base
          </button>
        </div>
      )}

      {/* Knowledge base grid */}
      {!isLoading && knowledgeBases.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {knowledgeBases.map((kb) => (
            <Link
              key={kb.id}
              to={`/workspaces/${workspaceId}/knowledge-bases/${kb.id}`}
              className="group block rounded border p-5 animate-fade-in"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {kb.name}
                    </p>
                    {kb.description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {kb.description}
                      </p>
                    )}
                  </div>
                </div>
                <ContextMenu
                  items={[
                    { label: 'Rename', onClick: () => setRenameTarget(kb) },
                    { label: 'Delete', onClick: () => setDeleteTarget(kb), danger: true },
                  ]}
                />
              </div>
              <div className="flex items-center gap-1 mt-3" style={{ color: 'var(--accent-text)' }}>
                <span className="text-xs">Open</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateKnowledgeBaseModal
          workspaceId={workspaceId}
          onClose={() => setShowCreate(false)}
          onCreated={handleKbCreated}
        />
      )}

      {renameTarget && (
        <RenameModal
          title="Rename Knowledge Base"
          currentName={renameTarget.name}
          onRename={handleRename}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Knowledge Base"
          message={`Are you sure you want to delete "${deleteTarget.name}"? All documents and conversations within it will be permanently deleted.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
