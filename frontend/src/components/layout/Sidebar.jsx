/**
 * Sidebar — persistent left-navigation for the authenticated app shell.
 *
 * Shows:
 *  - Logo + wordmark
 *  - Home, Search nav items
 *  - WORKSPACES: list from API, active workspace tree expanded
 *  - RECENT CONVERSATIONS: last 5 from localStorage
 *  - Bottom: Settings, Help, User info + logout
 *
 * Responsive:
 *  - >= md: always visible, 220px
 *  - < md: hidden, toggled via isOpen prop + overlay backdrop
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as workspaceService from '../../services/workspace.service.js';
import { getRecentConversations } from '../../utils/recentConversations.js';

// ── Icons (inline SVG for zero-dep) ────────────────────────────

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function WorkspaceIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

function ChevronRight() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function NavItem({ to, icon: Icon, label, shortcut, active }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-2.5 px-3 py-1.5 rounded text-sm cursor-pointer no-underline transition-colors"
      style={{
        backgroundColor: active ? 'var(--nav-active-bg)' : 'transparent',
        color: active ? 'var(--nav-active-text)' : 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <span className="flex items-center gap-2.5">
        {Icon && <Icon />}
        {label}
      </span>
      {shortcut && (
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{shortcut}</span>
      )}
    </Link>
  );
}

// ── Workspace tree item ──────────────────────────────────────────

const WS_SUB_ITEMS = [
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'projects',  label: 'Projects' },
  { key: 'members',   label: 'Members' },
  { key: 'settings',  label: 'Settings' },
];

function WorkspaceTreeItem({ ws, isExpanded, onToggle, activeWorkspaceId, location }) {
  const isActive = String(ws.id) === String(activeWorkspaceId);

  return (
    <div>
      {/* Workspace row */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded cursor-pointer select-none transition-colors"
        style={{
          backgroundColor: isActive && !isExpanded ? 'var(--nav-active-bg)' : 'transparent',
          color: isActive ? 'var(--nav-active-text)' : 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)'; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
        onClick={onToggle}
        title={ws.name}
      >
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </span>
        <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
          {ws.name?.[0]?.toUpperCase() || 'W'}
        </span>
        <span className="text-sm truncate">{ws.name}</span>
      </div>

      {/* Sub-items */}
      {isExpanded && (
        <div className="ml-5 pl-2 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
          {WS_SUB_ITEMS.map((item) => {
            const href = `/workspaces/${ws.id}?tab=${item.key}`;
            const activeTab = new URLSearchParams(location.search).get('tab') || 'knowledge';
            const subActive = isActive && activeTab === item.key;
            return (
              <Link
                key={item.key}
                to={href}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-sm no-underline transition-colors"
                style={{
                  color: subActive ? 'var(--nav-active-text)' : 'var(--text-secondary)',
                  backgroundColor: subActive ? 'var(--nav-active-bg)' : 'transparent',
                }}
                onMouseEnter={(e) => { if (!subActive) e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)'; }}
                onMouseLeave={(e) => { if (!subActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Section label ────────────────────────────────────────────────

function SectionLabel({ children, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-3 pt-5 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {children}
      </span>
      {action && (
        <button
          onClick={onAction}
          className="cursor-pointer rounded p-0.5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          title={action}
        >
          <PlusIcon />
        </button>
      )}
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────

export default function Sidebar({ isOpen, onClose, onNewWorkspace }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [recentConversations, setRecentConversations] = useState([]);

  // Parse active workspace ID from URL
  const workspaceMatch = location.pathname.match(/\/workspaces\/(\d+)/);
  const activeWorkspaceId = workspaceMatch ? workspaceMatch[1] : null;

  // Load workspaces
  useEffect(() => {
    workspaceService.getWorkspaces()
      .then((data) => setWorkspaces(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Auto-expand active workspace
  useEffect(() => {
    if (activeWorkspaceId) {
      setExpandedIds((prev) => new Set([...prev, activeWorkspaceId]));
    }
  }, [activeWorkspaceId]);

  // Load recent conversations
  useEffect(() => {
    setRecentConversations(getRecentConversations());
  }, [location.pathname]); // refresh when navigation happens

  const toggleWorkspace = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id));
      else next.add(String(id));
      return next;
    });
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const isHomePath = location.pathname === '/home' || location.pathname === '/';
  const isSearchPath = location.pathname === '/search';

  const sidebarContent = (
    <nav
      className="h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)', width: 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0">
        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
          <span className="text-white font-bold text-xs">R</span>
        </div>
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>RecallAI</span>
      </div>

      {/* Scrollable nav body */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {/* Home + Search */}
        <div className="flex flex-col gap-0.5 mb-1">
          <NavItem to="/home" icon={HomeIcon} label="Home" active={isHomePath} />
          <NavItem to="/search" icon={SearchIcon} label="Search" shortcut="⌘K" active={isSearchPath} />
        </div>

        {/* Workspaces */}
        <SectionLabel action="New Workspace" onAction={onNewWorkspace}>Workspaces</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {workspaces.map((ws) => (
            <WorkspaceTreeItem
              key={ws.id}
              ws={ws}
              isExpanded={expandedIds.has(String(ws.id))}
              onToggle={() => toggleWorkspace(ws.id)}
              activeWorkspaceId={activeWorkspaceId}
              location={location}
            />
          ))}
          {workspaces.length === 0 && (
            <p className="text-xs px-3 py-2" style={{ color: 'var(--text-muted)' }}>
              No workspaces yet.
            </p>
          )}
        </div>

        {/* Recent conversations */}
        {recentConversations.length > 0 && (
          <>
            <SectionLabel>Recent</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {recentConversations.map((rc) => {
                const href = `/workspaces/${rc.workspaceId}/knowledge-bases/${rc.knowledgeBaseId}/conversations/${rc.conversationId}`;
                const isActive = location.pathname === href;
                return (
                  <Link
                    key={rc.conversationId}
                    to={href}
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-sm no-underline transition-colors"
                    style={{
                      color: isActive ? 'var(--nav-active-text)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    title={rc.title}
                  >
                    <span style={{ flexShrink: 0 }}><ChatIcon /></span>
                    <span className="truncate">{rc.title}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom section */}
      <div className="shrink-0 border-t px-2 py-2" style={{ borderColor: 'var(--sidebar-border)' }}>
        <NavItem to="/search" icon={SettingsIcon} label="Settings" />
        <div
          className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded cursor-pointer transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={handleLogout}
          title="Sign out"
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-semibold shrink-0"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:block h-full shrink-0" style={{ width: 'var(--sidebar-width)' }}>
        {sidebarContent}
      </div>

      {/* Mobile: overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />
          {/* Sidebar panel */}
          <div className="relative animate-sidebar-in h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
