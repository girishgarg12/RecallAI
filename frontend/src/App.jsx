import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';

// Auth pages (no shell)
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// App pages (inside AppShell)
import HomePage from './pages/HomePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import WorkspacePage from './pages/WorkspacePage.jsx';
import KnowledgeBasePage from './pages/KnowledgeBasePage.jsx';
import ConversationPage from './pages/ConversationPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes — no shell */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — inside AppShell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
              <Route
                path="/workspaces/:workspaceId/knowledge-bases/:knowledgeBaseId"
                element={<KnowledgeBasePage />}
              />
              <Route
                path="/workspaces/:workspaceId/knowledge-bases/:knowledgeBaseId/conversations/:conversationId"
                element={<ConversationPage />}
              />
            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
