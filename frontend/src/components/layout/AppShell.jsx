/**
 * AppShell — persistent application frame for all authenticated pages.
 *
 * Renders: <Sidebar> + <main><Outlet /></main>
 * Replaces the old per-page AppLayout.
 *
 * Responsive:
 *  - md+: sidebar fixed left, main scrolls
 *  - <md: hamburger button reveals sidebar overlay
 */

import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import CreateWorkspaceModal from '../CreateWorkspaceModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const navigate = useNavigate();
  const { isLoading } = useAuth();

  function handleWorkspaceCreated(newWorkspace) {
    setShowCreateWorkspace(false);
    navigate(`/workspaces/${newWorkspace.id}`);
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewWorkspace={() => setShowCreateWorkspace(true)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar (hamburger only) */}
        <div
          className="md:hidden flex items-center gap-3 px-4 h-14 shrink-0 border-b"
          style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer p-1 rounded"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <HamburgerIcon />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
              <span className="text-white font-bold text-[10px]">R</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>RecallAI</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-base)' }}>
          <Outlet />
        </main>
      </div>

      {/* Create Workspace Modal (triggered from sidebar) */}
      {showCreateWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspace(false)}
          onCreated={handleWorkspaceCreated}
        />
      )}
    </div>
  );
}
