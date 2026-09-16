/**
 * CreateWorkspaceModal
 */

import { useState } from 'react';
import * as workspaceService from '../services/workspace.service.js';

const VISIBILITY_OPTIONS = ['PRIVATE', 'TEAM', 'PUBLIC'];

export default function CreateWorkspaceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', visibility: 'PRIVATE' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = { name: form.name.trim() };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.visibility) payload.visibility = form.visibility;
      const newWorkspace = await workspaceService.createWorkspace(payload);
      onCreated(newWorkspace);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create workspace.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--bg-elevated)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded border p-6 animate-fade-in"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            New Workspace
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Name <span style={{ color: 'var(--status-error)' }}>*</span>
            </label>
            <input
              id="ws-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="My Workspace"
              className="w-full px-3 py-2.5 rounded text-sm border focus:outline-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Description{' '}
              <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <textarea
              id="ws-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="What is this workspace for?"
              className="w-full px-3 py-2.5 rounded text-sm border focus:outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          {/* Visibility */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Visibility
            </label>
            <select
              id="ws-visibility"
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded text-sm border focus:outline-none cursor-pointer"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            >
              {VISIBILITY_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Error */}
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

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded text-sm font-medium border cursor-pointer"
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
              disabled={isSubmitting || !form.name.trim()}
              className="flex-1 py-2.5 rounded text-sm font-medium text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--accent)' }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
