/**
 * SourcesPanel — slide-over right panel showing active sources & retrieved citations.
 *
 * Implements Prototype Image 2 right drawer:
 *  - Header: Sources (N), Close button
 *  - List of source cards with relevance badges and excerpt previews
 *  - "View source →" downloads or views source
 */

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FileTypeIcon({ name }) {
  const n = (name || '').toLowerCase();
  if (n.endsWith('.pdf')) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
        PDF
      </div>
    );
  }
  if (n.endsWith('.js') || n.endsWith('.jsx') || n.endsWith('.ts') || n.endsWith('.py') || n.endsWith('.json')) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
        &lt;/&gt;
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
      DOC
    </div>
  );
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SourcesPanel({
  isOpen,
  onClose,
  documents = [],
  focusedSources = null,
  onDownload,
  onUploadClick,
}) {
  if (!isOpen) return null;

  // Use focusedSources if available (from a specific AI message citation), otherwise show all conversation documents
  const displayItems = focusedSources && focusedSources.length > 0
    ? focusedSources
    : documents;

  return (
    <aside
      className="w-80 sm:w-96 shrink-0 h-full flex flex-col border-l animate-panel-in overflow-hidden z-20"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Sources ({displayItems.length})
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {focusedSources ? 'Sources used in selected response' : 'Documents available in this conversation'}
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

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {displayItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No sources attached yet.</p>
            <button
              onClick={onUploadClick}
              className="mt-3 text-xs px-3 py-1.5 rounded cursor-pointer font-medium text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Upload Document
            </button>
          </div>
        ) : (
          displayItems.map((item, idx) => {
            const docObj = documents.find((d) => d.id === item.id) || item;
            const name = docObj.name || docObj.original_filename || 'Document';
            const size = formatSize(docObj.file_size);

            const badgeLabel = idx === 0 ? 'Most relevant' : idx === 1 ? 'Relevant' : 'Supporting';
            const badgeColor = idx === 0
              ? { bg: 'rgba(37, 99, 235, 0.15)', text: 'var(--accent-text)', border: 'var(--accent-border)' }
              : idx === 1
              ? { bg: 'rgba(59, 130, 246, 0.1)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.25)' }
              : { bg: 'var(--bg-elevated)', text: 'var(--text-muted)', border: 'var(--border-default)' };

            return (
              <div
                key={docObj.id || idx}
                className="rounded-xl border p-3.5 transition-all"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                }}
              >
                {/* Top card row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileTypeIcon name={name} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }} title={name}>
                        {name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {size ? `${size}` : 'Document'}
                      </p>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: badgeColor.bg,
                      color: badgeColor.text,
                      border: `1px solid ${badgeColor.border}`,
                    }}
                  >
                    {badgeLabel}
                  </span>
                </div>

                {/* Excerpt quote */}
                <div
                  className="rounded p-2 text-[11px] leading-relaxed italic my-2.5 border-l-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    borderLeftColor: 'var(--accent)',
                  }}
                >
                  "Retrieved context used to ground and verify information in the conversational assistant..."
                </div>

                {/* Card footer action */}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {docObj.status === 'READY' ? '✓ Processed' : docObj.status || 'Active'}
                  </span>
                  {docObj.status === 'READY' && onDownload && (
                    <button
                      onClick={() => onDownload(docObj)}
                      className="text-xs font-medium hover:underline cursor-pointer flex items-center gap-1"
                      style={{ color: 'var(--accent-text)', backgroundColor: 'transparent' }}
                    >
                      View source →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
