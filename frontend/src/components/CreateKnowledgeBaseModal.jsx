/**
 * CreateKnowledgeBaseModal
 * POST /knowledge-bases → { name, description?, workspaceId (integer) }
 */

import { useState } from 'react';
import * as knowledgeBaseService from '../services/knowledgeBase.service.js';

export default function CreateKnowledgeBaseModal({ workspaceId, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
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
      const payload = {
        name: form.name.trim(),
        workspaceId: Number(workspaceId), // backend expects number
      };
      if (form.description.trim()) payload.description = form.description.trim();
      const newKb = await knowledgeBaseService.createKnowledgeBase(payload);
      onCreated(newKb);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create knowledge base.');
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
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border p-6 animate-fade-in"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            New Knowledge Base
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Name <span style={{ color: 'var(--status-error)' }}>*</span>
            </label>
            <input
              id="kb-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Product Documentation"
              className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--purple-500)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Description <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <textarea
              id="kb-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Describe what documents this knowledge base will contain."
              className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--purple-500)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          {error && (
            <div
              className="text-sm px-3 py-2 rounded-lg border"
              style={{
                color: 'var(--status-error)',
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.2)',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors"
              style={{
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-default)',
                backgroundColor: 'transparent',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim()}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-60"
              style={{ backgroundColor: 'var(--purple-600)' }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'var(--purple-700)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--purple-600)')}
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
