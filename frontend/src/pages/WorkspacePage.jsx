/**
 * WorkspacePage — shows a workspace's knowledge bases.
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import * as workspaceService from '../services/workspace.service.js';
import * as knowledgeBaseService from '../services/knowledgeBase.service.js';
import CreateKnowledgeBaseModal from '../components/CreateKnowledgeBaseModal.jsx';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

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

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: workspace?.name || 'Workspace' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="min-w-0">
          {isLoading ? (
            <>
              <div className="skeleton h-6 w-48 mb-2" />
              <div className="skeleton h-4 w-64" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {workspace?.name || 'Workspace'}
              </h1>
              {workspace?.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
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
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--purple-600)' }}
          onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'var(--purple-700)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--purple-600)')}
        >
          <span className="text-lg leading-none">+</span>
          New Knowledge Base
        </button>
      </div>

      {/* Section title */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
        Knowledge Bases
      </h2>

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

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 border"
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
          className="text-center py-20 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          <div
            className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No knowledge bases yet
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Create a knowledge base to start uploading documents and chatting with your data.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer transition-all"
            style={{ backgroundColor: 'var(--purple-600)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--purple-700)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--purple-600)')}
          >
            Create knowledge base
          </button>
        </div>
      )}

      {/* Knowledge base grid */}
      {!isLoading && knowledgeBases.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {knowledgeBases.map((kb) => (
            <Link
              key={kb.id}
              to={`/workspaces/${workspaceId}/knowledge-bases/${kb.id}`}
              className="group block rounded-xl p-5 border transition-all duration-150 animate-fade-in"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--purple-600)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--purple-400)' }}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {kb.name}
                  </h2>
                  {kb.description && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {kb.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3" style={{ color: 'var(--purple-500)' }}>
                <span className="text-xs font-medium">Open</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {showCreate && (
        <CreateKnowledgeBaseModal
          workspaceId={workspaceId}
          onClose={() => setShowCreate(false)}
          onCreated={handleKbCreated}
        />
      )}
    </AppLayout>
  );
}
