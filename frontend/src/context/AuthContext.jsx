/**
 * AuthContext — centralized authentication state management.
 *
 * Stores: user object, accessToken (in sessionStorage), loading state
 * Provides: login, logout, register actions
 *
 * Token storage strategy:
 *  - Access token: sessionStorage (cleared when tab/browser closes)
 *  - Refresh token: httpOnly cookie (managed by backend, not accessible to JS)
 *
 * On app mount, attempts to restore session via /auth/refresh using the
 * refresh token cookie. If the cookie is valid, a new access token is
 * issued silently. If not, the user stays logged out.
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
      const storedUser = sessionStorage.getItem('user');
      const storedToken = sessionStorage.getItem('accessToken');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setIsLoading(false);
        return;
      }

      // Try silent refresh using the httpOnly cookie
      try {
        const { data } = await apiClient.post('/auth/refresh', {}, { withCredentials: true });
        sessionStorage.setItem('accessToken', data.accessToken);
        // We don't have user info from refresh — need to call /users/me or rely on stored user
        // Backend /auth/refresh only returns { accessToken }, not user object.
        // If we have stored user, use it; otherwise session stays null until explicit login.
        const cachedUser = sessionStorage.getItem('user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
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
