import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import type { App as AppType, Group, DashboardOverview, RevenueTrendItem } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './pages/DashboardView';
import { AppsView } from './pages/AppsView';
import { GroupsView } from './pages/GroupsView';
import { RevenueView } from './pages/RevenueView';
import { NotificationsView } from './pages/NotificationsView';
import { CrossMarketingView } from './pages/CrossMarketingView';
import { CrashDeskView } from './pages/CrashDeskView';
import { FeedbackView } from './pages/FeedbackView';
import { LoginView } from './pages/LoginView';

// Protected Admin Layout Component
interface AdminLayoutProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ theme, toggleTheme, onLogout }) => {
  const [selectedAppId, setSelectedAppId] = useState('');
  const [apps, setApps] = useState<AppType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrendItem[]>([]);
  const [userDistribution, setUserDistribution] = useState<{ countries: any[]; os: any[] }>({
    countries: [],
    os: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (apps.length > 0) {
      fetchAnalytics();
    }
  }, [selectedAppId]);

  const loadBaseData = async () => {
    setIsLoading(true);
    try {
      const [appsRes, groupsRes] = await Promise.all([
        api.get('/admin/apps'),
        api.get('/admin/groups')
      ]);

      if (appsRes.data.success) setApps(appsRes.data.apps);
      if (groupsRes.data.success) setGroups(groupsRes.data.groups);

      await fetchAnalytics();
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      if (err.response?.status === 401) {
        onLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [overviewRes, revenueRes, usersRes] = await Promise.all([
        api.get('/admin/analytics/overview', { params: { app_id: selectedAppId } }),
        api.get('/admin/analytics/revenue', { params: { app_id: selectedAppId, days: 30 } }),
        api.get('/admin/analytics/users', { params: { app_id: selectedAppId } })
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (revenueRes.data.success) setRevenueTrends(revenueRes.data.trends);
      if (usersRes.data.success) {
        setUserDistribution({
          countries: usersRes.data.countries,
          os: usersRes.data.os
        });
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      if (err.response?.status === 401) {
        onLogout();
      }
    }
  };

  const selectedApp = apps.find((a) => a._id === selectedAppId);
  const selectedAppName = selectedApp ? selectedApp.app_name : 'All Registered Applications';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      {/* Persistent Left Sidebar */}
      <Sidebar pendingCrashCount={overview?.pending_crashes || 0} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          apps={apps}
          selectedAppId={selectedAppId}
          setSelectedAppId={setSelectedAppId}
          onRefresh={loadBaseData}
          onLogout={onLogout}
          isLoading={isLoading}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <main style={{ flex: 1, padding: '28px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <DashboardView
                  overview={overview}
                  revenueTrends={revenueTrends}
                  userDistribution={userDistribution}
                  selectedAppName={selectedAppName}
                />
              }
            />
            <Route
              path="/apps"
              element={<AppsView apps={apps} groups={groups} onRefresh={loadBaseData} />}
            />
            <Route
              path="/groups"
              element={<GroupsView groups={groups} apps={apps} onRefresh={loadBaseData} />}
            />
            <Route
              path="/revenue"
              element={<RevenueView selectedAppId={selectedAppId} />}
            />
            <Route
              path="/notifications"
              element={<NotificationsView apps={apps} groups={groups} />}
            />
            <Route
              path="/cross-marketing"
              element={<CrossMarketingView apps={apps} groups={groups} />}
            />
            <Route
              path="/crashes"
              element={<CrashDeskView selectedAppId={selectedAppId} />}
            />
            <Route
              path="/feedback"
              element={<FeedbackView selectedAppId={selectedAppId} />}
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('app_junction_token');
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_junction_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_junction_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (_token: string, _admin: any) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('app_junction_token');
    localStorage.removeItem('app_junction_admin');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginView
                onLoginSuccess={handleLoginSuccess}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            )
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <AdminLayout
                theme={theme}
                toggleTheme={toggleTheme}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
