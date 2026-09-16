/**
 * AppLayout — shared shell for all authenticated pages.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout({ children, breadcrumbs = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Top Navigation Bar */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo + Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
              {/* Brand mark — simple letter on dark surface */}
              <div
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent)', flexShrink: 0 }}
              >
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <span
                className="font-semibold text-sm hidden sm:block"
                style={{ color: 'var(--text-primary)' }}
              >
                RecallAI
              </span>
            </Link>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <>
                <span className="text-xs select-none" style={{ color: 'var(--text-muted)' }}>/</span>
                {breadcrumbs.map((crumb, idx) => (
                  <div key={idx} className="flex items-center gap-2 min-w-0">
                    {crumb.href ? (
                      <Link
                        to={crumb.href}
                        className="text-sm truncate max-w-[140px]"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
                        onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className="text-sm truncate max-w-[140px]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {crumb.label}
                      </span>
                    )}
                    {idx < breadcrumbs.length - 1 && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/</span>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* User + Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                {/* Avatar — monochrome initial */}
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {user.name}
                </span>
              </div>
            )}
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded border cursor-pointer"
              style={{
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-default)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
