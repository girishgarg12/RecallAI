/**
 * Auth API service
 *
 * POST /auth/register  — { name, email, password }
 * POST /auth/login     — { email, password } → { user, accessToken }; sets refreshToken cookie
 * POST /auth/logout    — reads refreshToken cookie; clears it
 * POST /auth/refresh   — reads refreshToken cookie → { accessToken }; rotates cookie
 */

import apiClient from './apiClient.js';

export async function register({ name, email, password }) {
  const { data } = await apiClient.post('/auth/register', { name, email, password });
  return data;
}

export async function login({ email, password }) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data; // { user: { id, name, email, role }, accessToken }
}

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function refreshAccessToken() {
  const { data } = await apiClient.post('/auth/refresh');
  return data; // { accessToken }
}
