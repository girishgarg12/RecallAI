/**
 * ConfirmDeleteModal — "Are you sure?" confirmation dialog.
 *
 * Props:
 *  title: string — e.g. "Delete Workspace"
 *  message: string — confirmation message
 *  onConfirm: () => Promise<void> | void
 *  onClose: () => void
 */

import { useState } from 'react';

export default function ConfirmDeleteModal({ title, message, onConfirm, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setIsDeleting(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed. Please try again.');
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => e.target === e.currentTarget && !isDeleting && onClose()}
    >
      <div
        className="w-full max-w-sm rounded border p-6 animate-fade-in"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>

        {error && (
          <div
            className="text-sm px-3 py-2 rounded border mb-4"
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
            disabled={isDeleting}
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
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded text-sm font-medium text-white cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: 'var(--status-error)' }}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
