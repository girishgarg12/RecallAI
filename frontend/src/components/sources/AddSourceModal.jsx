/**
 * AddSourceModal — extensible modal for adding knowledge sources.
 *
 * Implements Prototype Image 1, item 8:
 *  - Upload File (PDF, DOCX, TXT, MD) -> conversation-bound navigation / creation
 *  - Add URL -> Coming soon
 *  - Connect Repository -> Coming soon
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function RepoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export default function AddSourceModal({
  workspaceId,
  knowledgeBaseId,
  conversations = [],
  onCreateConversation,
  onClose,
}) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('file'); // 'file' | 'url' | 'repo'
  const [isCreatingConv, setIsCreatingConv] = useState(false);

  async function handleGoToNewConversation() {
    setIsCreatingConv(true);
    try {
      if (onCreateConversation) {
        await onCreateConversation();
      }
    } finally {
      setIsCreatingConv(false);
    }
  }

  function handleSelectConversation(convId) {
    onClose();
    navigate(`/workspaces/${workspaceId}/knowledge-bases/${knowledgeBaseId}/conversations/${convId}?upload=true`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl rounded-xl border p-6 animate-fade-in shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Add a source
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Choose the type of source you want to add to this knowledge base.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Source Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* 1. Upload File */}
          <div
            onClick={() => setSelectedType('file')}
            className="rounded-lg border p-4 cursor-pointer transition-all flex flex-col justify-between"
            style={{
              backgroundColor: selectedType === 'file' ? 'var(--nav-active-bg)' : 'var(--bg-elevated)',
              borderColor: selectedType === 'file' ? 'var(--accent)' : 'var(--border-default)',
            }}
          >
            <div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent-text)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                <FileIcon />
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Upload File
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                PDF, DOCX, TXT, MD
              </p>
            </div>
            <div className="mt-4">
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.15)',
                  color: 'var(--accent-text)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                Currently supported
              </span>
            </div>
          </div>

          {/* 2. Add URL */}
          <div
            className="rounded-lg border p-4 opacity-50 cursor-not-allowed flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <LinkIcon />
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Add URL
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Web page or article
              </p>
            </div>
            <div className="mt-4">
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-default)',
                }}
              >
                Coming soon
              </span>
            </div>
          </div>

          {/* 3. Connect Repository */}
          <div
            className="rounded-lg border p-4 opacity-50 cursor-not-allowed flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <RepoIcon />
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Connect Repository
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                GitHub, GitLab...
              </p>
            </div>
            <div className="mt-4">
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-default)',
                }}
              >
                Coming soon
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Section for Upload File */}
        {selectedType === 'file' && (
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Upload from a conversation
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  RecallAI attaches documents to conversations for active retrieval context.
                </p>
              </div>
              <button
                onClick={handleGoToNewConversation}
                disabled={isCreatingConv}
                className="px-3 py-1.5 rounded text-xs font-medium text-white cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
                onMouseEnter={(e) => !isCreatingConv && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
              >
                {isCreatingConv ? 'Starting…' : '+ Start New & Upload'}
              </button>
            </div>

            {conversations.length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Or select an existing conversation:
                </p>
                <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className="w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center justify-between cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.borderColor = 'var(--border-strong)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <span className="truncate">{c.title || `Conversation #${c.id}`}</span>
                      <span className="text-[10px]" style={{ color: 'var(--accent-text)' }}>
                        Open & upload →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                No conversations in this knowledge base yet. Click "+ Start New & Upload" to begin.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
