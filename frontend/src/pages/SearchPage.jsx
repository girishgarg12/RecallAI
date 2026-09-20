/**
 * SearchPage — future-ready global search interface.
 *
 * Implements Prototype Image 1, item 7:
 *  - "Search RecallAI" heading & subtitle
 *  - Search in options: All of RecallAI / Current Workspace / Specific Knowledge Base
 *  - Search input with Ctrl+K shortcut indicator
 *  - Honest hollow state (no fake search results)
 */

import { useState, useRef, useEffect } from 'react';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

const SEARCH_SCOPES = [
  { id: 'ALL', label: 'All of RecallAI', desc: 'Across all workspaces and knowledge bases' },
  { id: 'WORKSPACE', label: 'Current Workspace', desc: 'Only in the active workspace' },
  { id: 'KB', label: 'Specific Knowledge Base', desc: 'In a selected knowledge base' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState('ALL');
  const inputRef = useRef(null);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Search RecallAI
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Find information across all your workspaces, knowledge bases and conversations.
        </p>
      </div>

      {/* Scope radio options */}
      <div className="mb-5">
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
          Search in
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {SEARCH_SCOPES.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-xs"
              style={{
                backgroundColor: searchScope === s.id ? 'var(--nav-active-bg)' : 'var(--bg-surface)',
                borderColor: searchScope === s.id ? 'var(--accent)' : 'var(--border-default)',
                color: searchScope === s.id ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              <input
                type="radio"
                name="searchScope"
                value={s.id}
                checked={searchScope === s.id}
                onChange={() => setSearchScope(s.id)}
                className="accent-blue-600"
              />
              <span className="font-medium">{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Main search bar */}
      <div className="relative mb-8">
        <span className="absolute left-4 top-3.5" style={{ color: 'var(--text-muted)' }}>
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents, conversations, workspaces..."
          className="w-full pl-12 pr-20 py-3.5 rounded-xl border text-sm focus:outline-none shadow-sm transition-all"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
        />
        <div className="absolute right-4 top-3.5 flex items-center gap-1">
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Results / Empty state (Honest Hollow State) */}
      <div
        className="rounded-xl border p-10 text-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-muted)',
          }}
        >
          <LayersIcon />
        </div>

        {query.trim() ? (
          <div>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              No global search results for "{query}"
            </h2>
            <p className="text-xs max-w-md mx-auto mb-4" style={{ color: 'var(--text-muted)' }}>
              Global indexing across all workspaces is in active development.
              For conversational queries, open a conversation and select your retrieval scope.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Global Search
            </h2>
            <p className="text-xs max-w-md mx-auto mb-4" style={{ color: 'var(--text-secondary)' }}>
              RecallAI will index sources, conversations, and projects across your workspaces for instant retrieval.
            </p>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-default)',
          }}
        >
          <span>Feature coming soon</span>
        </div>
      </div>
    </div>
  );
}
