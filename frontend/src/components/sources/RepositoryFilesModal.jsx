/**
 * RepositoryFilesModal — shows the indexed file tree/list of a repository source.
 */

import { useState, useEffect } from 'react';
import * as documentService from '../../services/document.service.js';

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RepositoryFilesModal({
  knowledgeBaseId,
  repository,
  onClose
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchFiles() {
      if (!repository?.id) return;
      setLoading(true);
      setError('');
      try {
        const data = await documentService.getRepositoryFiles(knowledgeBaseId, repository.id);
        setFiles(data.files || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load repository files');
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [knowledgeBaseId, repository?.id]);

  const filteredFiles = files.filter(f =>
    !searchQuery.trim() || f.file_path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl rounded-xl border p-6 animate-fade-in shadow-2xl flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}
              >
                GIT
              </span>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {repository.name || 'Repository Files'}
              </h2>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {repository.source_url || 'GitHub Repository'} • {files.length} indexed files
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

        {/* Search bar */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Filter files by path (e.g. src/auth)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded text-xs border focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* File List content */}
        <div className="flex-1 overflow-y-auto min-h-48 border rounded p-2" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
          {loading && (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Loading repository files…
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--status-error)' }}>
              {error}
            </div>
          )}

          {!loading && !error && filteredFiles.length === 0 && (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              {files.length === 0 ? 'No files indexed yet or processing is in progress.' : 'No matching files found.'}
            </div>
          )}

          {!loading && !error && filteredFiles.length > 0 && (
            <div className="flex flex-col gap-1">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ color: 'var(--text-muted)' }}>
                      <CodeIcon />
                    </span>
                    <span className="truncate font-mono text-[11px]" title={file.file_path}>
                      {file.file_path}
                    </span>
                  </div>
                  <span className="text-[10px] shrink-0 ml-3" style={{ color: 'var(--text-muted)' }}>
                    {formatSize(file.file_size)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Files are automatically chunked and retrievable via chat RAG.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs border cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
