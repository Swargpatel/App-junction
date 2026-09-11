import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import {
  Layers,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, admin: any) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, theme, toggleTheme }) => {
  const [email, setEmail] = useState('admin@appjunction.com');
  const [password, setPassword] = useState('Admin@123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/admin/auth/login`, {
        email: email.trim(),
        password
      });

      if (res.data.success && res.data.token) {
        localStorage.setItem('app_junction_token', res.data.token);
        localStorage.setItem('app_junction_admin', JSON.stringify(res.data.admin));
        onLoginSuccess(res.data.token, res.data.admin);
      } else {
        setErrorMessage(res.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(
        err.response?.data?.message || 'Unable to connect to API server. Please verify backend is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@appjunction.com');
    setPassword('Admin@123456');
    setErrorMessage('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-dark)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        background:
          theme === 'dark'
            ? 'radial-gradient(ellipse at top, #1e1b4b 0%, #0B0F19 70%)'
            : 'radial-gradient(ellipse at top, #e0e7ff 0%, #F8FAFC 70%)'
      }}
    >
      {/* Theme Toggle Top-Right */}
      <div style={{ position: 'absolute', top: '24px', right: '28px' }}>
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: 'var(--radius-full)',
            padding: '8px 16px',
            fontWeight: 600
          }}
        >
          {theme === 'dark' ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} color="#6366F1" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-panel)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Layers size={28} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
            App Junction
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Centralized Multi-App Admin Command Center
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#F43F5E',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}
            >
              Admin Email ID
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail
                size={17}
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@appjunction.com"
                className="input-control"
                style={{
                  width: '100%',
                  paddingLeft: '42px',
                  paddingRight: '14px',
                  height: '44px',
                  fontSize: '0.88rem'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock
                size={17}
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input-control"
                style={{
                  width: '100%',
                  paddingLeft: '42px',
                  paddingRight: '42px',
                  height: '44px',
                  fontSize: '0.88rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              height: '46px',
              fontSize: '0.92rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
            }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Panel</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box (Requested by User) */}
        <div
          style={{
            marginTop: '26px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-pill)',
            border: '1px dashed var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={15} color="#6366F1" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                Demo Admin Credentials
              </span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#6366F1',
                background: 'rgba(99, 102, 241, 0.12)',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Auto-Fill
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '0.76rem'
            }}
          >
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem', fontWeight: 600 }}>LOGIN ID</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>
                admin@appjunction.com
              </div>
            </div>

            <div
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem', fontWeight: 600 }}>PASSWORD</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>
                Admin@123456
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div style={{ marginTop: '24px', fontSize: '0.76rem', color: 'var(--text-dim)', textAlign: 'center' }}>
        App Junction v2.4 • Secure Multi-Tenant Enterprise Mobile Platform
      </div>
    </div>
  );
};
