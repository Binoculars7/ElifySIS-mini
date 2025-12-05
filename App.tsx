/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { People } from './pages/People';
import { Finance } from './pages/Finance';
import { Admin } from './pages/Admin';
import { Reports } from './pages/Reports';
import { UserRole } from './types';

// Protected Route Component
const ProtectedRoute = ({ children, roles }: { children?: React.ReactNode, roles?: UserRole[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex justify-center items-center h-screen text-primary">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      <Route path="/sales" element={
        <ProtectedRoute roles={['ADMIN', 'MANAGER', 'CASHIER', 'SALES']}><Sales /></ProtectedRoute>
      } />
      
      <Route path="/inventory" element={
        <ProtectedRoute roles={['ADMIN', 'MANAGER']}><Inventory /></ProtectedRoute>
      } />
      
      <Route path="/people" element={
        <ProtectedRoute roles={['ADMIN', 'MANAGER']}><People /></ProtectedRoute>
      } />
      
      <Route path="/finance" element={
        <ProtectedRoute roles={['ADMIN']}><Finance /></ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute roles={['ADMIN', 'MANAGER']}><Reports /></ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute roles={['ADMIN']}><Admin /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
            <SettingsProvider>
                <NotificationProvider>
                    <AppRoutes />
                </NotificationProvider>
            </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;