/**
 * RenameModal — single-field rename dialog.
 *
 * Props:
 *  title: string — e.g. "Rename Workspace"
 *  currentName: string
 *  onRename: (newName: string) => Promise<void> | void
 *  onClose: () => void
 */

import { useState } from 'react';

export default function RenameModal({ title, currentName, onRename, onClose }) {
  const [name, setName] = useState(currentName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await onRename(trimmed);
    } catch (err) {
      setError(err?.response?.data?.message || 'Rename failed. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-sm rounded border p-6 animate-fade-in"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
            autoFocus
            className="w-full px-3 py-2.5 rounded text-sm border focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
          />

          {error && (
            <div
              className="text-sm px-3 py-2 rounded border"
              style={{
                color: 'var(--status-error)',
                backgroundColor: 'rgba(239,68,68,0.07)',
                borderColor: 'rgba(239,68,68,0.18)',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded text-sm font-medium border cursor-pointer disabled:opacity-50"
              style={{
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-default)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 py-2.5 rounded text-sm font-medium text-white cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            >
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
