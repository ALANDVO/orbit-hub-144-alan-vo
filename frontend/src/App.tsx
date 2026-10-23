/** Main App Component */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Header, MainLayout } from './components/layout';
import { Dashboard } from './pages/Dashboard';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { AuditPage } from './pages/AuditPage';
import { CraftFloorPage } from './pages/CraftFloorPage';
import { LoginPage } from './pages/LoginPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    // Check for demo user
    const demoUser = sessionStorage.getItem('demo_user');
    if (demoUser) {
      try {
        setUser(JSON.parse(demoUser));
      } catch {
        sessionStorage.removeItem('demo_user');
      }
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('demo_user');
    sessionStorage.removeItem('csrf_token');
    setUser(null);
    window.location.href = '/login';
  };

  const isAuthenticated = !!user || import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <>
      {isAuthenticated && <Header user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Dashboard />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/design-systems/:id"
          element={
            isAuthenticated ? (
              <MainLayout>
                <DesignSystemPage />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/design-systems/:id/audits/:auditId"
          element={
            isAuthenticated ? (
              <MainLayout>
                <AuditPage />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/craft-floor"
          element={
            isAuthenticated ? (
              <MainLayout>
                <CraftFloorPage />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}