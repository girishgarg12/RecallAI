/**
 * DashboardPage — lists the user's workspaces.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as workspaceService from '../services/workspace.service.js';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal.jsx';
import ContextMenu from '../components/common/ContextMenu.jsx';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal.jsx';
import RenameModal from '../components/common/RenameModal.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // CRUD modal state
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
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

  function handleWorkspaceCreated(newWorkspace) {
    setWorkspaces((prev) => [newWorkspace, ...prev]);
    setShowCreate(false);
  }

  async function handleRename(newName) {
    const updated = await workspaceService.updateWorkspace(renameTarget.id, { name: newName });
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === renameTarget.id ? { ...ws, ...updated } : ws))
    );
    setRenameTarget(null);
  }

  async function handleDelete() {
    await workspaceService.deleteWorkspace(deleteTarget.id);
    setWorkspaces((prev) => prev.filter((ws) => ws.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <AppLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Workspaces
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Welcome back, {user?.name || 'there'}.
          </p>
        </div>
        <button
          id="create-workspace-btn"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded text-sm font-medium text-white cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          <span className="text-base leading-none">+</span>
          New Workspace
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

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded border p-5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
              }}
            >
              <div className="skeleton h-4 w-3/4 mb-3" />
              <div className="skeleton h-3 w-1/2 mb-6" />
              <div className="skeleton h-3 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && workspaces.length === 0 && (
        <div
          className="text-center py-20 rounded border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div
            className="w-10 h-10 rounded mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            No workspaces yet
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Create a workspace to start organizing your knowledge bases.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/workspaces/${ws.id}`}
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
                <div
                  className="w-8 h-8 rounded flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {ws.visibility || 'PRIVATE'}
                  </span>
                  <ContextMenu
                    items={[
                      { label: 'Rename', onClick: () => setRenameTarget(ws) },
                      { label: 'Delete', onClick: () => setDeleteTarget(ws), danger: true },
                    ]}
                  />
                </div>
              </div>

              <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                {ws.name}
              </p>
              {ws.description && (
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {ws.description}
                </p>
              )}

              <div className="mt-4 flex items-center gap-1" style={{ color: 'var(--accent-text)' }}>
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
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={handleWorkspaceCreated}
        />
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
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will also delete all knowledge bases, documents, and conversations within it.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
