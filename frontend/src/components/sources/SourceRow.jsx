/**
 * SourceRow — a single row in the Sources table.
 *
 * Props:
 *  - source: document object
 *  - onRename: (source) => void
 *  - onDelete: (source) => void
 *  - onDownload: (source) => void
 */

import SourceStatusBadge from './SourceStatusBadge.jsx';
import ContextMenu from '../common/ContextMenu.jsx';

function FileTypeIcon({ mimeType, name, sourceType }) {
  if (sourceType === 'URL') {
    return (
      <div
        className="w-7 h-7 rounded flex items-center justify-center shrink-0 font-bold text-[9px]"
        style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}
      >
        URL
      </div>
    );
  }

  const fileName = (name || '').toLowerCase();
  const isPdf = mimeType?.includes('pdf') || fileName.endsWith('.pdf');
  const isDoc = mimeType?.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc');
  const isMd = fileName.endsWith('.md') || mimeType?.includes('markdown');

  if (isPdf) {
    return (
      <div
        className="w-7 h-7 rounded flex items-center justify-center shrink-0 font-bold text-[9px]"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}
      >
        PDF
      </div>
    );
  }
  if (isDoc) {
    return (
      <div
        className="w-7 h-7 rounded flex items-center justify-center shrink-0 font-bold text-[9px]"
        style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)' }}
      >
        DOC
      </div>
    );
  }
  if (isMd) {
    return (
      <div
        className="w-7 h-7 rounded flex items-center justify-center shrink-0 font-bold text-[9px]"
        style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)' }}
      >
        MD
      </div>
    );
  }

  return (
    <div
      className="w-7 h-7 rounded flex items-center justify-center shrink-0 font-bold text-[9px]"
      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
    >
      TXT
    </div>
  );
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SourceRow({ source, onRename, onDelete, onDownload }) {
  const isUrl = source.source_type === 'URL';
  const displayName = source.name || (isUrl ? source.source_url : source.original_filename) || 'Untitled source';

  const menuItems = [
    { label: 'Rename', onClick: () => onRename(source) },
    ...(!isUrl && source.status === 'READY' ? [{ label: 'Download', onClick: () => onDownload(source) }] : []),
    { label: 'Delete', onClick: () => onDelete(source), danger: true },
  ];

  return (
    <tr
      className="border-b transition-colors"
      style={{ borderColor: 'var(--border-subtle)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Name + Size / URL */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <FileTypeIcon mimeType={source.mime_type} name={source.name || source.original_filename} sourceType={source.source_type} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }} title={displayName}>
              {displayName}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }} title={isUrl ? source.source_url : undefined}>
              {isUrl ? (source.source_url || 'Webpage URL') : formatSize(source.file_size)}
            </p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {isUrl ? 'URL' : 'Document'}
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <SourceStatusBadge status={source.status} />
      </td>

      {/* Added date */}
      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        {formatDate(source.created_at)}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        <div className="inline-block text-left">
          <ContextMenu items={menuItems} />
        </div>
      </td>
    </tr>
  );
}
