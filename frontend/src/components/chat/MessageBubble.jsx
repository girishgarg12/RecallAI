/**
 * MessageBubble — modern chat message renderer.
 *
 * Implements Prototype Image 2 & Image 1 section 6:
 *  - User message: right-aligned, blue/slate tone, timestamp with checkmark
 *  - Assistant message: left-aligned, "R" brand avatar, fluid markdown/text
 *  - Sources citation chips below assistant message
 *  - Actions: copy response, thumbs up/down
 */

import { useState } from 'react';

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

function SourceChipIcon({ name }) {
  const n = (name || '').toLowerCase();
  if (n.endsWith('.pdf')) {
    return (
      <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
        P
      </span>
    );
  }
  if (n.endsWith('.js') || n.endsWith('.jsx') || n.endsWith('.ts') || n.endsWith('.py') || n.endsWith('.json')) {
    return (
      <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
        &lt;/&gt;
      </span>
    );
  }
  return (
    <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: 'rgba(161, 161, 170, 0.2)', color: 'var(--text-secondary)' }}>
      📄
    </span>
  );
}

export default function MessageBubble({ message, onOpenSources }) {
  const isUser = message.role === 'USER';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike'

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isUser) {
    return (
      <div className="flex justify-end animate-message my-2">
        <div className="flex flex-col items-end max-w-[80%] sm:max-w-[70%]">
          <div
            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.18)',
              border: '1px solid rgba(37, 99, 235, 0.35)',
              color: 'var(--text-primary)',
              opacity: message.optimistic ? 0.7 : 1,
            }}
          >
            {message.content}
          </div>
          <div className="flex items-center gap-1.5 mt-1 mr-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span>
              {message.created_at
                ? new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : 'just now'}
            </span>
            <span style={{ color: 'var(--accent-text)' }}>✓✓</span>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3.5 animate-message my-4 max-w-4xl">
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold shadow-xs mt-0.5"
        style={{
          backgroundColor: 'var(--accent)',
          color: '#ffffff',
        }}
      >
        R
      </div>

      {/* Message body */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            RecallAI
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {message.created_at
              ? new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : 'just now'}
          </span>
        </div>

        {/* Content */}
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap select-text"
          style={{ color: 'var(--text-primary)' }}
        >
          {message.content}
        </div>

        {/* Sources citations row */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Sources ({message.sources.length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {message.sources.map((src, idx) => (
                <button
                  key={src.id || idx}
                  onClick={() => onOpenSources && onOpenSources(message.sources)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  title="Click to view in Sources panel"
                >
                  <SourceChipIcon name={src.name} />
                  <span className="truncate max-w-[160px] font-medium">{src.name}</span>
                  <span className="text-[10px]" style={{ color: 'var(--accent-text)' }}>
                    {idx === 0 ? 'Primary' : 'Context'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions bar (Copy, Thumbs) */}
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            title="Copy message"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button
            onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
            className="p-1.5 rounded cursor-pointer transition-colors"
            style={{ color: feedback === 'like' ? 'var(--accent-text)' : 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = feedback === 'like' ? 'var(--accent-text)' : 'var(--text-muted)')}
            title="Good response"
          >
            <ThumbsUpIcon />
          </button>
          <button
            onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
            className="p-1.5 rounded cursor-pointer transition-colors"
            style={{ color: feedback === 'dislike' ? 'var(--status-error)' : 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = feedback === 'dislike' ? 'var(--status-error)' : 'var(--text-muted)')}
            title="Poor response"
          >
            <ThumbsDownIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
