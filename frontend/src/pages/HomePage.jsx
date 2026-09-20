/**
 * HomePage — dashboard overview.
 *
 * Shows:
 *  - Greeting + workspace count stat (the only count the API provides without extra calls)
 *  - Workspace cards with name, description, last updated
 *  - Workspace rename / delete
 *  - "New Workspace" button (also accessible from sidebar)
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import * as workspaceService from '../services/workspace.service.js';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal.jsx';
import ContextMenu from '../components/common/ContextMenu.jsx';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal.jsx';
import RenameModal from '../components/common/RenameModal.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function WorkspaceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const data = await workspaceService.getWorkspaces();
      setWorkspaces(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load workspaces.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreated(ws) {
    setWorkspaces((prev) => [ws, ...prev]);
    setShowCreate(false);
    navigate(`/workspaces/${ws.id}`);
  }

  async function handleRename(newName) {
    const updated = await workspaceService.updateWorkspace(renameTarget.id, { name: newName });
    setWorkspaces((prev) => prev.map((ws) => ws.id === renameTarget.id ? { ...ws, ...updated } : ws));
    setRenameTarget(null);
  }

  async function handleDelete() {
    await workspaceService.deleteWorkspace(deleteTarget.id);
    setWorkspaces((prev) => prev.filter((ws) => ws.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Here's what's happening in your knowledge spaces.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded text-sm font-medium text-white cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          <span className="font-light text-base leading-none">+</span>
          New Workspace
        </button>
      </div>

      {/* Stats row — only workspace count is reliably available */}
      {!isLoading && workspaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div
            className="flex items-center gap-4 px-5 py-4 rounded border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
          >
            <div className="w-9 h-9 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
              <WorkspaceIcon />
            </div>
            <div>
              <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{workspaces.length}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Workspaces</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 text-sm px-4 py-3 rounded border"
          style={{ color: 'var(--status-error)', backgroundColor: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.18)' }}>
          {error}
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Your Workspaces</h2>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded border p-5"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <div className="skeleton h-4 w-3/4 mb-3" />
              <div className="skeleton h-3 w-1/2 mb-6" />
              <div className="skeleton h-3 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && workspaces.length === 0 && (
        <div className="text-center py-20 rounded border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <div className="w-10 h-10 rounded mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <WorkspaceIcon />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No workspaces yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Create a workspace to start organizing your knowledge.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3.5 py-2 rounded text-sm font-medium text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          >
            Create workspace
          </button>
        </div>
      )}

      {/* Workspace grid */}
      {!isLoading && workspaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="group relative rounded border animate-fade-in"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <Link
                to={`/workspaces/${ws.id}`}
                className="block p-5 no-underline"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                    {ws.name?.[0]?.toUpperCase() || 'W'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{ws.name}</p>
                    {ws.description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{ws.description}</p>
                    )}
                  </div>
                </div>
                {ws.updated_at && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Updated {formatRelativeTime(ws.updated_at)}
                  </p>
                )}
              </Link>

              {/* Context menu — absolute positioned, doesn't interfere with link */}
              <div className="absolute top-4 right-4">
                <ContextMenu
                  items={[
                    { label: 'Rename', onClick: () => setRenameTarget(ws) },
                    { label: 'Delete', onClick: () => setDeleteTarget(ws), danger: true },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateWorkspaceModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {renameTarget && (
        <RenameModal
          title="Rename Workspace"
          currentName={renameTarget.name}
          onRename={handleRename}
          onClose={() => setRenameTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Workspace"
          message={`Delete "${deleteTarget.name}"? All knowledge bases, documents, and conversations inside will be permanently deleted.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
