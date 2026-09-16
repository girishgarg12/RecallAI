/**
 * Workspace API service
 *
 * POST   /workspaces          — { name, description?, visibility? } → workspace
 * GET    /workspaces          — → [ workspace ]
 * GET    /workspaces/:id      — → workspace
 * PATCH  /workspaces/:id      — { name?, description?, visibility? } → workspace
 * DELETE /workspaces/:id      — 204
 *
 * Workspace visibility values: "PRIVATE" | "TEAM" | "PUBLIC"
 */

import apiClient from './apiClient.js';

export async function createWorkspace({ name, description, visibility }) {
  const payload = { name };
  if (description !== undefined) payload.description = description;
  if (visibility !== undefined) payload.visibility = visibility;
  const { data } = await apiClient.post('/workspaces', payload);
  return data;
}

export async function getWorkspaces() {
  const { data } = await apiClient.get('/workspaces');
  return data; // array of workspace objects
}

export async function getWorkspaceById(id) {
  const { data } = await apiClient.get(`/workspaces/${id}`);
  return data;
}

export async function updateWorkspace(id, updates) {
  const { data } = await apiClient.patch(`/workspaces/${id}`, updates);
  return data;
}

export async function deleteWorkspace(id) {
  await apiClient.delete(`/workspaces/${id}`);
}
