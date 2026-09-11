import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Smartphone,
  FolderKanban,
  CreditCard,
  Bell,
  Megaphone,
  Bug,
  MessageSquare,
  Radio
} from 'lucide-react';

interface SidebarProps {
  pendingCrashCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingCrashCount }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', alias: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/apps', label: 'Applications', icon: Smartphone },
    { path: '/groups', label: 'App Groups', icon: FolderKanban },
    { path: '/revenue', label: 'Revenue & Churn', icon: CreditCard },
    { path: '/notifications', label: 'Push Notifications', icon: Bell },
    { path: '/cross-marketing', label: 'Cross-Marketing', icon: Megaphone },
    { path: '/crashes', label: 'Crash Desk', icon: Bug, badge: pendingCrashCount },
    { path: '/feedback', label: 'Feedback & Reviews', icon: MessageSquare }
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <div
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Radio size={22} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              App Junction
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Multi-App Command Center
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const currentPath = location.pathname;
            const isActive =
              currentPath === item.path ||
              (item.alias && currentPath === item.alias) ||
              (item.path !== '/' && currentPath.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0.06) 100%)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
                  boxShadow: isActive ? '0 4px 16px -2px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.885rem',
                  letterSpacing: isActive ? '-0.01em' : 'normal',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  width: '100%',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon
                    size={19}
                    color={isActive ? '#818CF8' : 'currentColor'}
                    style={{
                      transition: 'color 0.2s ease',
                      filter: isActive ? 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.5))' : 'none'
                    }}
                  />
                  <span style={{ fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 ? (
                  <span
                    style={{
                      background: 'rgba(244, 63, 94, 0.2)',
                      color: '#FB7185',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(244, 63, 94, 0.25)'
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
