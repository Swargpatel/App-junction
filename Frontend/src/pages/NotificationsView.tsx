import React, { useState, useEffect } from 'react';
import type { App, Group, NotificationCampaign } from '../types';
import api from '../api';
import {
  Bell,
  Plus,
  Clock,
  Globe,
  Send,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Search,
  Filter,
  Trash2,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';

interface NotificationsViewProps {
  apps: App[];
  groups: Group[];
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ apps, groups }) => {
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appFilter, setAppFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'SENT'>('ALL');

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetTime, setTargetTime] = useState('20:00'); // 8:00 PM local time default
  const [selectedApp, setSelectedApp] = useState('');
  const [targetCountry, setTargetCountry] = useState('ALL');
  const [targetAudience, setTargetAudience] = useState('ALL');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/admin/notifications');
      if (res.data.success) {
        setCampaigns(res.data.campaigns);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setLoading(true);
    try {
      const res = await api.post('/admin/notifications/create', {
        app_id: selectedApp || null,
        title,
        message,
        target_local_time: targetTime,
        target_country: targetCountry,
        target_audience: targetAudience
      });

      if (res.data.success) {
        setShowModal(false);
        setTitle('');
        setMessage('');
        fetchCampaigns();
        alert(res.data.message || 'Notification campaign scheduled successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating notification');
    } finally {
      setLoading(false);
    }
  };

  // Metrics Calculations
  const totalCampaigns = campaigns.length;
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.total_sent || 0), 0);
  const activeAppsCount = new Set(campaigns.map((c) => c.app_id?._id).filter(Boolean)).size || apps.length;

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch =
      camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesApp = !appFilter || camp.app_id?._id === appFilter;
    const matchesStatus = statusFilter === 'ALL' || camp.status === statusFilter;
    return matchesSearch && matchesApp && matchesStatus;
  });

  const selectedAppObj = apps.find((a) => a._id === selectedApp);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Push Notification Command Center
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
              Timezone Worker Active
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '720px' }}>
            Orchestrate automated local-timezone push notifications across all applications. Target users worldwide at their exact local evening time (e.g. 8:00 PM in each user's country).
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{
            padding: '11px 20px',
            fontSize: '0.88rem',
            boxShadow: '0 4px 18px rgba(99, 102, 241, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={18} />
          <span>New Notification Campaign</span>
        </button>
      </div>

      {/* 4 Stat Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        {/* Total Campaigns */}
        <div className="stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Campaigns
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '4px' }}>
                {totalCampaigns}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.14)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bell size={20} color="#818CF8" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.76rem', color: '#818CF8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={13} />
            <span>Multi-App Broadcast Ready</span>
          </div>
        </div>

        {/* Total Delivered */}
        <div className="stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Messages Delivered
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                {totalDelivered.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={20} color="#10B981" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.76rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Send size={13} />
            <span>FCM Delivery Verified</span>
          </div>
        </div>

        {/* Target Local Delivery Time */}
        <div className="stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Target Delivery Time
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
                20:00 <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Local</span>
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Clock size={20} color="#F59E0B" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.76rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Globe size={13} />
            <span>24 Timezones Synced</span>
          </div>
        </div>

        {/* Covered Applications */}
        <div className="stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Covered Applications
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#06B6D4', marginTop: '4px' }}>
                {apps.length} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Apps</span>
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.14)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Smartphone size={20} color="#06B6D4" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.76rem', color: '#06B6D4', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Layers size={13} />
            <span>Single / Group Targeting</span>
          </div>
        </div>
      </div>

      {/* Global Timezone Engine Smart Explanation Banner */}
      <div className="glass-panel timezone-banner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                flexShrink: 0
              }}
            >
              <Radio size={22} color="#FFFFFF" />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                Automated Local Timezone Dispatcher Engine Active
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: '1.4' }}>
                When you schedule a campaign for <strong style={{ color: 'var(--primary)', fontWeight: 800, background: 'rgba(99, 102, 241, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>8:00 PM</strong>, users receive it at exactly 8:00 PM in their respective home countries.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="timezone-chip">
              🇮🇳 IST (UTC+5:30)
            </span>
            <span className="timezone-chip">
              🇺🇸 EST (UTC-5)
            </span>
            <span className="timezone-chip">
              🇬🇧 GMT (UTC+0)
            </span>
            <span className="timezone-chip">
              🇯🇵 JST (UTC+9)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search campaigns by title or message..."
              className="input-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.84rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="input-control"
            style={{ width: '210px', height: '38px', fontSize: '0.84rem' }}
            value={appFilter}
            onChange={(e) => setAppFilter(e.target.value)}
          >
            <option value="">🌐 All Applications</option>
            {apps.map((a) => (
              <option key={a._id} value={a._id}>
                📱 {a.app_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-pill)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          {(['ALL', 'SCHEDULED', 'SENT'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === tab ? 'var(--primary)' : 'transparent',
                color: statusFilter === tab ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.18s ease'
              }}
            >
              {tab === 'ALL' ? 'All' : tab === 'SCHEDULED' ? 'Scheduled' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaign Info</th>
              <th>Target App</th>
              <th>Scheduled Time</th>
              <th>Audience / Country</th>
              <th>Delivery Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-dim)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Bell size={32} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>No notification campaigns found</span>
                    <span style={{ fontSize: '0.8rem' }}>Create a new campaign to schedule smart pushes.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((camp) => (
                <tr key={camp._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        <Bell size={16} color="#818CF8" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.9rem' }}>{camp.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>
                          {camp.message}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: 'var(--bg-pill)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)'
                      }}
                    >
                      <Smartphone size={13} color="#818CF8" />
                      {camp.app_id?.app_name || 'All Applications'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FBBF24', fontWeight: 700, fontSize: '0.84rem' }}>
                      <Clock size={14} />
                      <span>{camp.target_local_time} Local</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {camp.target_audience === 'ALL' ? 'All Users' : 'Active 7 Days'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Country: {camp.target_country}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#34D399', fontWeight: 800, fontSize: '0.88rem' }}>
                        {camp.total_sent?.toLocaleString() || 0}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>delivered</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${camp.status.toLowerCase()}`}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        borderRadius: '6px'
                      }}
                    >
                      {camp.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Notification Campaign Modal with Live Mobile Lockscreen Preview */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '28px',
              maxWidth: '820px',
              width: '94%',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-accent)',
              background: 'var(--bg-modal)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
                  Create Push Notification Campaign
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Compose notification message and preview how it appears on user mobile devices.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
              {/* Form Input Side */}
              <form onSubmit={handleCreateNotification} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Target Application
                  </label>
                  <select
                    className="input-control"
                    value={selectedApp}
                    onChange={(e) => setSelectedApp(e.target.value)}
                  >
                    <option value="">🌐 Broadcast to All Applications (100+)</option>
                    {apps.map((a) => (
                      <option key={a._id} value={a._id}>
                        📱 {a.app_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Weekend Offer! 🎉"
                    className="input-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Message Content *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Unlock Premium features with 50% discount today..."
                    className="input-control"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                      Target Local Time *
                    </label>
                    <input
                      type="time"
                      className="input-control"
                      value={targetTime}
                      onChange={(e) => setTargetTime(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                      Delivers at this exact time in each user's country
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                      Target Audience
                    </label>
                    <select
                      className="input-control"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    >
                      <option value="ALL">All Registered Users</option>
                      <option value="ACTIVE_LAST_7_DAYS">Active in last 7 days</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                    {loading ? 'Scheduling...' : 'Dispatch Campaign'}
                  </button>
                </div>
              </form>

              {/* Live Mobile Lockscreen Mockup Preview */}
              <div
                style={{
                  background: 'rgba(10, 12, 18, 0.95)',
                  borderRadius: '20px',
                  padding: '24px 18px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '16px' }}>
                  📱 Real-Time Device Lockscreen Preview
                </span>

                {/* Smartphone Mockup */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '280px',
                    borderRadius: '24px',
                    background: 'linear-gradient(180deg, #181C26 0%, #0D1017 100%)',
                    border: '3px solid rgba(255, 255, 255, 0.15)',
                    padding: '20px 14px',
                    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8), 0 8px 24px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  {/* Phone speaker notch */}
                  <div style={{ width: '50px', height: '4px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.2)' }} />

                  {/* Lockscreen clock */}
                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 300, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {targetTime || '20:00'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                      Tuesday, September 8
                    </div>
                  </div>

                  {/* Notification Card */}
                  <div
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '14px',
                      padding: '10px 12px',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            background: 'linear-gradient(135deg, #6366F1, #EC4899)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Bell size={9} color="#FFFFFF" />
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#FFFFFF' }}>
                          {selectedAppObj?.app_name || 'App Junction'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.6)' }}>now</span>
                    </div>

                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                      {title || 'Your Notification Title'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.3' }}>
                      {message || 'Type message in the form to see real-time preview...'}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.64rem', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', marginTop: '6px' }}>
                    Swipe up to open
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
