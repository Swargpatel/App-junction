import React from 'react';
import type { App } from '../types';
import { RefreshCw, Filter, ShieldCheck, Sun, Moon, LogOut } from 'lucide-react';

interface HeaderProps {
  apps: App[];
  selectedAppId: string;
  setSelectedAppId: (id: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apps,
  selectedAppId,
  setSelectedAppId,
  onRefresh,
  onLogout,
  isLoading,
  theme,
  toggleTheme
}) => {
  return (
    <header
      style={{
        height: '70px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-header)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      {/* App Filter Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Scope:</span>
        </div>
        <select
          value={selectedAppId}
          onChange={(e) => setSelectedAppId(e.target.value)}
          className="input-control"
          style={{ width: '240px', padding: '7px 12px', fontSize: '0.85rem' }}
        >
          <option value="">🌐 All Applications ({apps.length})</option>
          {apps.map((app) => (
            <option key={app._id} value={app._id}>
              📱 {app.app_name}
            </option>
          ))}
        </select>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          id="btn-theme-toggle"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 13px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600
          }}
        >
          {theme === 'dark' ? (
            <Sun size={15} color="#F59E0B" />
          ) : (
            <Moon size={15} color="#6366F1" />
          )}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-full)' }}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>

        {/* Admin User Chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-user-chip)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={16} color="#FFF" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Super Admin</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>admin@appjunction.com</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="btn btn-secondary btn-sm"
          title="Sign out of Admin Panel"
          id="btn-admin-logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            color: '#F43F5E',
            borderColor: 'rgba(244, 63, 94, 0.3)',
            background: 'rgba(244, 63, 94, 0.08)'
          }}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
