/**
 * SourceStatusBadge — status indicator for sources/documents.
 *
 * Backend statuses:
 *  - UPLOADED
 *  - PROCESSING
 *  - READY
 *  - FAILED
 */

export default function SourceStatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();

  if (normalized === 'READY') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{
          color: 'var(--status-success)',
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Processed
      </span>
    );
  }

  if (normalized === 'PROCESSING') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{
          color: 'var(--status-warning)',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        Processing
      </span>
    );
  }

  if (normalized === 'FAILED') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{
          color: 'var(--status-error)',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Failed
      </span>
    );
  }

  // UPLOADED or default
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        color: 'var(--status-info)',
        backgroundColor: 'rgba(96, 165, 250, 0.08)',
        border: '1px solid rgba(96, 165, 250, 0.2)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      Uploaded
    </span>
  );
}
