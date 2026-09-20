/**
 * Composer — message composer matching Prototype Image 2.
 *
 * Layout:
 *  ┌────────────────────────────────────────────────────────────┐
 *  │ +   Ask anything about your knowledge...            📎  ↑  │
 *  │                                                            │
 *  │     Search in: Knowledge Base ▾      ⊕ Sources 3           │
 *  └────────────────────────────────────────────────────────────┘
 */

import { useState, useRef, useEffect } from 'react';

function ArrowUpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const SCOPE_OPTIONS = [
  { value: 'KNOWLEDGE_BASE', label: 'Knowledge Base' },
  { value: 'CONVERSATION', label: 'Conversation' },
  { value: 'SOURCE', label: 'Current Source' },
];

export default function Composer({
  input,
  setInput,
  onSend,
  isSending,
  scope,
  onScopeChange,
  selectedSourceId,
  onSourceChange,
  readyDocs = [],
  documents = [],
  isUploading,
  onFileUpload,
  onToggleSourcesPanel,
  sourcesPanelOpen,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Close scope dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setScopeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(e);
    }
  }

  const currentScopeLabel = SCOPE_OPTIONS.find((s) => s.value === scope)?.label || 'Conversation';

  return (
    <div
      className="rounded-2xl border p-3.5 shadow-lg transition-all"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
        onChange={onFileUpload}
        className="hidden"
      />

      {/* Top Input Row */}
      <div className="flex items-start gap-2.5">
        {/* + Action button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-1.5 rounded-lg cursor-pointer transition-colors mt-0.5 shrink-0"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          title="Upload document to this conversation"
        >
          {isUploading ? (
            <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin block" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          ) : (
            <PlusIcon />
          )}
        </button>

        {/* Text Area */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your knowledge..."
            rows={1}
            disabled={isSending}
            className="w-full bg-transparent border-0 text-sm focus:outline-none resize-none"
            style={{
              color: 'var(--text-primary)',
              lineHeight: '1.5',
              maxHeight: '180px',
            }}
          />
        </div>

        {/* Right action icons (Paperclip + Send) */}
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-1.5 rounded-lg cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            title="Attach file"
          >
            <PaperclipIcon />
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || isSending}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => !(isSending || !input.trim()) && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            title="Send message"
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>

      {/* Bottom Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        {/* Scope Selector */}
        <div className="flex items-center gap-2" ref={dropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setScopeDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: scopeDropdownOpen ? 'var(--accent)' : 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Search in:</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {currentScopeLabel}
              </span>
              <span style={{ color: 'var(--text-muted)' }}><ChevronDown /></span>
            </button>

            {/* Scope Dropdown */}
            {scopeDropdownOpen && (
              <div
                className="absolute left-0 bottom-full mb-1.5 w-48 rounded-lg border shadow-xl z-50 p-1 animate-fade-in"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                }}
              >
                {SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onScopeChange(opt.value);
                      setScopeDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center justify-between cursor-pointer"
                    style={{
                      backgroundColor: scope === opt.value ? 'var(--nav-active-bg)' : 'transparent',
                      color: scope === opt.value ? 'var(--accent-text)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (scope !== opt.value) e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      if (scope !== opt.value) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{opt.label}</span>
                    {scope === opt.value && <span className="text-[10px]">●</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* If Single Source Scope is chosen, show quick doc selector */}
          {scope === 'SOURCE' && (
            <div className="flex items-center gap-1.5">
              {readyDocs.length > 0 ? (
                <select
                  value={selectedSourceId}
                  onChange={(e) => onSourceChange(e.target.value)}
                  className="px-2 py-1 rounded text-xs border focus:outline-none cursor-pointer max-w-[150px] truncate"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                  }}
                >
                  {readyDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name || doc.original_filename}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[11px]" style={{ color: 'var(--status-error)' }}>
                  {documents.length === 0 ? 'Upload a doc first' : 'Document processing...'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sources button indicator */}
        <button
          type="button"
          onClick={onToggleSourcesPanel}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors border"
          style={{
            backgroundColor: sourcesPanelOpen ? 'var(--nav-active-bg)' : 'var(--bg-elevated)',
            borderColor: sourcesPanelOpen ? 'var(--accent)' : 'var(--border-default)',
            color: sourcesPanelOpen ? 'var(--accent-text)' : 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (!sourcesPanelOpen) {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!sourcesPanelOpen) {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
          title="Toggle Sources panel"
        >
          <LayersIcon />
          <span>Sources</span>
          <span
            className="text-[10px] px-1.5 py-0.2 rounded font-mono"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--accent-text)',
            }}
          >
            {documents.length}
          </span>
        </button>
      </div>
    </div>
  );
}
