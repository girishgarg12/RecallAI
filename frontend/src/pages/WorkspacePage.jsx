/**
 * WorkspacePage — tab-based workspace view.
 *
 * Tabs:
 *  Knowledge  — KB grid (fully functional)
 *  Projects   — hollow / coming soon
 *  Members    — hollow / coming soon
 *  Settings   — rename + delete workspace (functional)
 *
 * URL: /workspaces/:workspaceId?tab=knowledge|projects|members|settings
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import * as workspaceService from '../services/workspace.service.js';
import * as knowledgeBaseService from '../services/knowledgeBase.service.js';
import CreateKnowledgeBaseModal from '../components/CreateKnowledgeBaseModal.jsx';
import ContextMenu from '../components/common/ContextMenu.jsx';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal.jsx';
import RenameModal from '../components/common/RenameModal.jsx';

// ── Icons ────────────────────────────────────────────────────────

function KBIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

// ── Tab bar ──────────────────────────────────────────────────────

const TABS = [
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'projects',  label: 'Projects' },
  { key: 'members',   label: 'Members' },
  { key: 'settings',  label: 'Settings' },
];

function TabBar({ activeTab, onTab }) {
  return (
    <div className="flex items-center border-b" style={{ borderColor: 'var(--border-default)' }}>
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onTab(t.key)}
          className="px-4 py-3 text-sm cursor-pointer border-b-2 -mb-px transition-colors"
          style={{
            borderBottomColor: activeTab === t.key ? 'var(--accent)' : 'transparent',
            color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: 'transparent',
            fontWeight: activeTab === t.key ? '500' : '400',
          }}
          onMouseEnter={(e) => { if (activeTab !== t.key) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { if (activeTab !== t.key) e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Knowledge tab ────────────────────────────────────────────────

function KnowledgeTab({ workspaceId }) {
  const navigate = useNavigate();
  const [kbs, setKbs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { load(); }, [workspaceId]);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const data = await knowledgeBaseService.getKnowledgeBasesByWorkspace(workspaceId);
      setKbs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load knowledge bases.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKbCreated(kb) {
    setKbs((prev) => [kb, ...prev]);
    setShowCreate(false);
    navigate(`/workspaces/${workspaceId}/knowledge-bases/${kb.id}`);
  }

  async function handleRename(newName) {
    const updated = await knowledgeBaseService.patchKnowledgeBase(renameTarget.id, { name: newName });
    setKbs((prev) => prev.map((kb) => kb.id === renameTarget.id ? { ...kb, ...updated } : kb));
    setRenameTarget(null);
  }

  async function handleDelete() {
    await knowledgeBaseService.deleteKnowledgeBase(deleteTarget.id);
    setKbs((prev) => prev.filter((kb) => kb.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="rounded border p-5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <div className="skeleton h-4 w-3/4 mb-3" /><div className="skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="text-sm px-4 py-3 rounded border"
      style={{ color: 'var(--status-error)', backgroundColor: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.18)' }}>
      {error}
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Knowledge Bases</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-white cursor-pointer"
          style={{ backgroundColor: 'var(--accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          <span className="font-light text-base leading-none">+</span>
          New Knowledge Base
        </button>
      </div>

      {kbs.length === 0 ? (
        <div className="text-center py-16 rounded border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <div className="w-10 h-10 rounded mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <KBIcon />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No knowledge bases yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Create a knowledge base to start building your AI knowledge.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="px-3.5 py-2 rounded text-sm font-medium text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          >
            Create knowledge base
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {kbs.map((kb) => (
            <div key={kb.id} className="relative group rounded border animate-fade-in"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <Link to={`/workspaces/${workspaceId}/knowledge-bases/${kb.id}`}
                className="block p-5 no-underline" style={{ textDecoration: 'none' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                    <KBIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{kb.name}</p>
                    {kb.description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{kb.description}</p>
                    )}
                  </div>
                </div>
              </Link>
              <div className="absolute top-4 right-4">
                <ContextMenu items={[
                  { label: 'Rename', onClick: () => setRenameTarget(kb) },
                  { label: 'Delete', onClick: () => setDeleteTarget(kb), danger: true },
                ]} />
              </div>
            </div>
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
        <RenameModal title="Rename Knowledge Base" currentName={renameTarget.name}
          onRename={handleRename} onClose={() => setRenameTarget(null)} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal title="Delete Knowledge Base"
          message={`Delete "${deleteTarget.name}"? All documents and conversations inside will be permanently deleted.`}
          onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
    </>
  );
}

// ── Hollow tabs ──────────────────────────────────────────────────

function ComingSoonTab({ title, description }) {
  return (
    <div className="text-center py-20">
      <div className="w-10 h-10 rounded mx-auto mb-4 flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-sm max-w-sm mx-auto mb-5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      <span className="inline-block text-xs px-3 py-1.5 rounded"
        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>
        Coming soon
      </span>
    </div>
  );
}

// ── Settings tab ─────────────────────────────────────────────────

function SettingsTab({ workspace, onWorkspaceUpdated, onWorkspaceDeleted }) {
  const [name, setName] = useState(workspace?.name || '');
  const [description, setDescription] = useState(workspace?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || '');
      setDescription(workspace.description || '');
    }
  }, [workspace]);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      const updated = await workspaceService.updateWorkspace(workspace.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onWorkspaceUpdated(updated);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await workspaceService.deleteWorkspace(workspace.id);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete workspace.');
    }
  }

  return (
    <div className="max-w-lg">
      <h3 className="text-sm font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Workspace Settings</h3>

      {error && (
        <div className="mb-4 text-sm px-3 py-2 rounded border"
          style={{ color: 'var(--status-error)', backgroundColor: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.18)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 rounded text-sm"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Visibility</label>
          <span className="inline-block text-xs px-2 py-1 rounded font-mono"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
            {workspace?.visibility || 'PRIVATE'}
          </span>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={isSaving || !name.trim()}
            className="px-3.5 py-2 rounded text-sm font-medium text-white cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-12 pt-6 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--status-error)' }}>Danger Zone</h4>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Permanently delete this workspace and all its knowledge bases, documents, and conversations.
        </p>
        <button onClick={() => setShowDelete(true)}
          className="px-3.5 py-2 rounded text-sm font-medium cursor-pointer border"
          style={{ color: 'var(--status-error)', borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
          Delete Workspace
        </button>
      </div>

      {showDelete && (
        <ConfirmDeleteModal
          title="Delete Workspace"
          message={`Delete "${workspace?.name}"? This will permanently delete all knowledge bases, documents, and conversations inside.`}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'knowledge';

  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [workspaceId]);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const ws = await workspaceService.getWorkspaceById(workspaceId);
      setWorkspace(ws);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load workspace.');
    } finally {
      setIsLoading(false);
    }
  }

  function setTab(t) {
    setSearchParams({ tab: t }, { replace: true });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          <Link to="/home" className="hover:underline" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>RecallAI</Link>
          <span>/</span>
          <Link to="/home" className="hover:underline" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Workspaces</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{workspace?.name || '…'}</span>
        </div>

        {/* Workspace identity */}
        {isLoading ? (
          <div className="mb-5">
            <div className="skeleton h-5 w-48 mb-2" />
            <div className="skeleton h-3 w-64" />
          </div>
        ) : error ? (
          <div className="mb-5 text-sm px-4 py-3 rounded border"
            style={{ color: 'var(--status-error)', backgroundColor: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        ) : (
          <div className="mb-5">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{workspace?.name}</h1>
            {workspace?.description && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{workspace.description}</p>
            )}
          </div>
        )}

        <TabBar activeTab={activeTab} onTab={setTab} />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto px-6 md:px-8 py-6">
        {activeTab === 'knowledge' && <KnowledgeTab workspaceId={workspaceId} />}
        {activeTab === 'projects' && (
          <ComingSoonTab
            title="Projects"
            description="Create projects to organize work around specific goals and knowledge. Projects contain tasks, conversations, and dedicated knowledge."
          />
        )}
        {activeTab === 'members' && (
          <ComingSoonTab
            title="Members"
            description="Workspace collaboration is coming soon. Invite teammates, manage roles, and collaborate on shared knowledge."
          />
        )}
        {activeTab === 'settings' && workspace && (
          <SettingsTab
            workspace={workspace}
            onWorkspaceUpdated={(updated) => setWorkspace(updated)}
            onWorkspaceDeleted={() => {}}
          />
        )}
      </div>
    </div>
  );
}
