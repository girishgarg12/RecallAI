/**
 * AuthContext — centralized authentication state management.
 *
 * Stores: user object, accessToken (in sessionStorage), loading state
 * Provides: login, logout, register actions
 *
 * Token storage strategy:
 *  - Access token: sessionStorage (cleared when tab/browser closes)
 *  - Refresh token: httpOnly cookie (managed by backend, not accessible to JS)
 *  - User info: localStorage (persists across tabs for session restoration)
 *
 * On app mount, attempts to restore session via /auth/refresh using the
 * refresh token cookie. If the cookie is valid, a new access token is
 * issued silently. If not, the user stays logged out.
 *
 * The backend's /auth/refresh endpoint only returns { accessToken }, not user
 * info. To support cross-tab session restore, the non-sensitive user object
 * (id, name, email, role) is cached in localStorage during login and restored
 * on successful refresh. Access tokens are NEVER stored in localStorage.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth.service.js';
import apiClient from '../services/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // starts true — checking session

  // ── Restore session on mount ──────────────────────────────
  useEffect(() => {
    const restore = async () => {
      // First check sessionStorage (same-tab fast path)
      const storedToken = sessionStorage.getItem('accessToken');
      const sessionUser = sessionStorage.getItem('user');

      if (storedToken && sessionUser) {
        setUser(JSON.parse(sessionUser));
        setIsLoading(false);
        return;
      }

      // Try silent refresh using the httpOnly cookie (works cross-tab)
      try {
        const { data } = await apiClient.post('/auth/refresh', {}, { withCredentials: true });
        sessionStorage.setItem('accessToken', data.accessToken);

        // Restore user from localStorage (cross-tab), or sessionStorage
        const cachedUser = sessionUser || localStorage.getItem('recallai_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          setUser(parsed);
          // Ensure sessionStorage is in sync for this tab
          sessionStorage.setItem('user', cachedUser);
        }
        // If no cached user at all, the refresh token was valid but we have
        // no user info. The user will see the dashboard but with null user
        // data — login() will fix this.
      } catch {
        // No valid refresh token — user is not authenticated
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    restore();
  }, []);

  // ── Register ──────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password }) => {
    const data = await authService.register({ name, email, password });
    return data;
  }, []);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const data = await authService.login({ email, password });
    // data = { user: { id, name, email, role }, accessToken }
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    // Cache user (non-sensitive) in localStorage for cross-tab restore
    localStorage.setItem('recallai_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if logout request fails, clear local session
    } finally {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
      localStorage.removeItem('recallai_user');
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
