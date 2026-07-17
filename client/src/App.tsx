import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { VoiceAssistant } from './components/VoiceAssistant';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastProvider';

// Lazy load pages for dynamic code splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = React.lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));

// Loading spinner fallback component for dynamic pages
const PageLoader: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-[#0a0f1d]">
    <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
  </div>
);

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main App Router Wrapper
const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  // Choose standard chatbot language context
  const currentLang = localStorage.getItem('arenamind_chat_lang') || 'english';

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><LandingPage /></Layout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ResetPassword />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Floating Multilingual Voice AI assistant is active when logged in */}
      {user && (
        <VoiceAssistant
          currentLanguage={currentLang}
          userRole={user.role}
        />
      )}
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
