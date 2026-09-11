import React, { useState, useEffect } from 'react';
import api from '../api';
import type { CancellationStats } from '../types';
import { DateRangeFilter } from '../components/DateRangeFilter';
import {
  DollarSign,
  AlertTriangle,
  TrendingDown,
  Repeat,
  ShieldAlert,
  UserX,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Clock,
  Smartphone,
  Globe,
  Tag,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RevenueViewProps {
  selectedAppId: string;
}

export const RevenueView: React.FC<RevenueViewProps> = ({ selectedAppId }) => {
  // Stats
  const [cancellationData, setCancellationData] = useState<CancellationStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Date Filtering State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Tabs: 'cancellations' | 'subscriptions'
  const [activeTab, setActiveTab] = useState<'cancellations' | 'subscriptions'>('cancellations');

  // Cancelled Subscriptions state
  const [cancelPage, setCancelPage] = useState(1);
  const [cancelLimit] = useState(8);
  const [expandedCancelId, setExpandedCancelId] = useState<string | null>(null);

  // Purchased Subscriptions state
  const [subStatusFilter, setSubStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED'>('ALL');
  const [subPage, setSubPage] = useState(1);
  const [subLimit] = useState(8);
  const [subsData, setSubsData] = useState<{ subscriptions: any[]; pagination: any } | null>(null);
  const [subsLoading, setSubsLoading] = useState(false);

  // Fetch High-Level Stats & Cancellations
  useEffect(() => {
    fetchMainData();
  }, [selectedAppId, cancelPage, startDate, endDate]);

  // Fetch Subscriptions when tab or filters change
  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    }
  }, [selectedAppId, subPage, subStatusFilter, activeTab, startDate, endDate]);

  const fetchMainData = async () => {
    setLoading(true);
    try {
      const [cancelRes, revRes] = await Promise.all([
        api.get('/admin/analytics/cancellations', {
          params: { app_id: selectedAppId, page: cancelPage, limit: cancelLimit, startDate, endDate }
        }),
        api.get('/admin/analytics/revenue', { params: { app_id: selectedAppId, startDate, endDate } })
      ]);

      if (cancelRes.data.success) setCancellationData(cancelRes.data);
      if (revRes.data.success) setRevenueStats(revRes.data);
    } catch (err) {
      console.error('Error fetching revenue analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const res = await api.get('/admin/analytics/subscriptions', {
        params: {
          app_id: selectedAppId,
          status: subStatusFilter,
          page: subPage,
          limit: subLimit,
          startDate,
          endDate
        }
      });
      if (res.data.success) {
        setSubsData(res.data);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setSubsLoading(false);
    }
  };

  const toggleExpandCancel = (id: string) => {
    setExpandedCancelId(expandedCancelId === id ? null : id);
  };

  if (loading && !cancellationData) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        Loading revenue, subscription & churn analytics...
      </div>
    );
  }

  const cancelPagination = cancellationData?.pagination || {
    total: cancellationData?.cancellations_list?.length || 0,
    page: cancelPage,
    pages: Math.ceil((cancellationData?.cancellations_list?.length || 0) / cancelLimit) || 1,
    limit: cancelLimit
  };

  const subPagination = subsData?.pagination || {
    total: subsData?.subscriptions?.length || 0,
    page: subPage,
    pages: Math.ceil((subsData?.subscriptions?.length || 0) / subLimit) || 1,
    limit: subLimit
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Date Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            Revenue & Subscription Churn Management
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Detailed monetization breakdown, active subscriber lists, churn exit-surveys, and multi-app revenue velocity
          </p>
        </div>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setCancelPage(1);
            setSubPage(1);
          }}
        />
      </div>

      {/* Hero Churn & Renewal Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="stat-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Subscribers
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
            {cancellationData?.active_subscriptions || 0}
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Currently generating recurring MRR
          </div>
        </div>

        <div className="stat-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Cancellations
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#F43F5E', marginTop: '6px' }}>
            {cancellationData?.cancelled_subscriptions || 0}
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Users who opted out or cancelled
          </div>
        </div>

        <div className="stat-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Churn Ratio
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#F59E0B', marginTop: '6px' }}>
            {cancellationData?.churn_rate_percent || 0}%
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Cancellation retention efficiency
          </div>
        </div>
      </div>

      {/* Grid: Cancellation Reasons & App Revenue Contribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '20px' }}>
        {/* Cancellation Reason Analysis (tbl_cancel_subscriptionreason) */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="#F43F5E" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              Cancellation Reasons Breakdown
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Aggregated feedback and exit reasons captured from mobile users upon cancellation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {cancellationData?.reasons_breakdown && cancellationData.reasons_breakdown.length > 0 ? (
              cancellationData.reasons_breakdown.map((r, i) => {
                const totalCancellations = Math.max(
                  cancellationData.cancelled_subscriptions,
                  cancellationData.reasons_breakdown.reduce((sum: number, x: any) => sum + (x.count || 0), 0),
                  1
                );
                const percent = Math.min(100, Math.round((r.count / totalCancellations) * 100));
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r._id || 'Unspecified Reason'}</span>
                      <span style={{ color: '#F43F5E', fontWeight: 700 }}>
                        {r.count} ({percent}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-pill)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${percent}%`,
                          background: 'linear-gradient(90deg, #F43F5E, #EC4899)',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', padding: '20px 0' }}>
                No cancellation feedback recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* App-wise Revenue Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <DollarSign size={18} color="#10B981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              Application Revenue Contribution
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {revenueStats?.app_breakdown && revenueStats.app_breakdown.length > 0 ? (
              revenueStats.app_breakdown.map((appItem: any) => (
                <div
                  key={appItem.app_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                      {appItem.app_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {appItem.transactions} transactions recorded
                    </div>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10B981' }}>
                    ${appItem.revenue?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', padding: '20px 0' }}>
                No application transactions logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed Data Explorer Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('cancellations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'cancellations' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-pill)',
                color: activeTab === 'cancellations' ? '#F43F5E' : 'var(--text-muted)',
                outline: activeTab === 'cancellations' ? '1px solid rgba(244, 63, 94, 0.4)' : 'none'
              }}
            >
              <UserX size={16} />
              <span>Cancelled Subscriptions & Exit Feedback</span>
              <span
                style={{
                  background: activeTab === 'cancellations' ? '#F43F5E' : 'var(--border-color)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}
              >
                {cancellationData?.cancelled_subscriptions || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'subscriptions' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-pill)',
                color: activeTab === 'subscriptions' ? '#10B981' : 'var(--text-muted)',
                outline: activeTab === 'subscriptions' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              <CreditCard size={16} />
              <span>Purchased & Active Subscriptions</span>
              <span
                style={{
                  background: activeTab === 'subscriptions' ? '#10B981' : 'var(--border-color)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}
              >
                {cancellationData?.active_subscriptions || 0}
              </span>
            </button>
          </div>

          {/* If Subscriptions tab is active, show status filters */}
          {activeTab === 'subscriptions' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {(['ALL', 'ACTIVE', 'CANCELLED', 'EXPIRED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => {
                    setSubStatusFilter(st);
                    setSubPage(1);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: subStatusFilter === st ? 'var(--primary-color)' : 'var(--bg-pill)',
                    color: subStatusFilter === st ? '#FFFFFF' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: CANCELLED SUBSCRIPTIONS TABLE */}
        {activeTab === 'cancellations' && (
          <div>
            {cancellationData?.cancellations_list && cancellationData.cancellations_list.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-dim)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      <th style={{ padding: '12px 14px' }}>User / Device ID</th>
                      <th style={{ padding: '12px 14px' }}>Application</th>
                      <th style={{ padding: '12px 14px' }}>Exit Reason & Feedback</th>
                      <th style={{ padding: '12px 14px' }}>Plan / Spent</th>
                      <th style={{ padding: '12px 14px' }}>Attempts</th>
                      <th style={{ padding: '12px 14px' }}>Cancelled Date</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancellationData.cancellations_list.map((rec: any) => {
                      const isExpanded = expandedCancelId === rec._id;
                      const hasMultiple = rec.cancellations && rec.cancellations.length > 1;
                      const latestCancel =
                        rec.cancellations && rec.cancellations.length > 0
                          ? rec.cancellations[rec.cancellations.length - 1]
                          : {
                              reason_text: rec.reason_text || 'No reason specified',
                              custom_feedback: rec.custom_feedback || '',
                              plan_name: rec.plan_name || '',
                              total_spent: rec.total_spent || 0,
                              cancelled_at: rec.cancelled_at || rec.updated_at
                            };

                      return (
                        <React.Fragment key={rec._id}>
                          <tr
                            style={{
                              borderBottom: isExpanded ? 'none' : '1px solid var(--border-color)',
                              transition: 'background 0.15s ease',
                              background: isExpanded ? 'var(--bg-pill)' : 'transparent'
                            }}
                          >
                            {/* Device & User Info */}
                            <td style={{ padding: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Smartphone size={15} color="var(--text-dim)" />
                                <div>
                                  <div
                                    style={{
                                      fontFamily: 'monospace',
                                      fontSize: '0.82rem',
                                      fontWeight: 700,
                                      color: 'var(--text-heading)'
                                    }}
                                  >
                                    {rec.device_unique_Id ||
                                      rec.user_id?.device_unique_Id ||
                                      rec._id?.substring(0, 16)}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.72rem',
                                      color: 'var(--text-dim)',
                                      display: 'flex',
                                      gap: '6px',
                                      marginTop: '2px'
                                    }}
                                  >
                                    <span>{rec.user_id?.os_type || 'ANDROID'}</span>
                                    <span>•</span>
                                    <span>{rec.user_id?.country || 'IN'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* App Name */}
                            <td style={{ padding: '14px' }}>
                              <span
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--bg-pill)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  border: '1px solid var(--border-color)'
                                }}
                              >
                                {rec.app_id?.app_name || 'Application'}
                              </span>
                            </td>

                            {/* Exit Reason & Custom Feedback */}
                            <td style={{ padding: '14px', maxWidth: '320px' }}>
                              <div
                                style={{
                                  fontSize: '0.84rem',
                                  fontWeight: 700,
                                  color: '#F43F5E',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>{latestCancel.reason_text}</span>
                              </div>
                              {latestCancel.custom_feedback && (
                                <div
                                  style={{
                                    fontSize: '0.76rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '4px',
                                    fontStyle: 'italic',
                                    background: 'var(--bg-pill)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    borderLeft: '2px solid #F43F5E'
                                  }}
                                >
                                  "{latestCancel.custom_feedback}"
                                </div>
                              )}
                            </td>

                            {/* Plan & Amount */}
                            <td style={{ padding: '14px' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {latestCancel.plan_name || 'Standard Plan'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800 }}>
                                ${Number(latestCancel.total_spent || 0).toFixed(2)}
                              </div>
                            </td>

                            {/* Total Cancellations Attempt Badge */}
                            <td style={{ padding: '14px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  background:
                                    (rec.total_cancellations || rec.cancellations?.length || 1) > 1
                                      ? 'rgba(236, 72, 153, 0.15)'
                                      : 'var(--bg-pill)',
                                  color:
                                    (rec.total_cancellations || rec.cancellations?.length || 1) > 1
                                      ? '#EC4899'
                                      : 'var(--text-dim)',
                                  border: '1px solid var(--border-color)'
                                }}
                              >
                                {rec.total_cancellations || rec.cancellations?.length || 1} Hit
                                {(rec.total_cancellations || rec.cancellations?.length || 1) > 1 ? 's' : ''}
                              </span>
                            </td>

                            {/* Date */}
                            <td style={{ padding: '14px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                              {new Date(latestCancel.cancelled_at || rec.updated_at).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </td>

                            {/* Expand History Button */}
                            <td style={{ padding: '14px', textAlign: 'right' }}>
                              {hasMultiple ? (
                                <button
                                  onClick={() => toggleExpandCancel(rec._id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    border: '1px solid var(--border-color)',
                                    background: isExpanded ? '#F43F5E' : 'var(--bg-pill)',
                                    color: isExpanded ? '#FFFFFF' : 'var(--text-main)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span>{isExpanded ? 'Hide' : 'All'} ({rec.cancellations.length})</span>
                                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Single</span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Cancellation History Sub-Table */}
                          {isExpanded && hasMultiple && (
                            <tr style={{ background: 'var(--bg-pill)', borderBottom: '1px solid var(--border-color)' }}>
                              <td colSpan={7} style={{ padding: '16px 20px' }}>
                                <div
                                  style={{
                                    padding: '14px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-panel)',
                                    border: '1px solid var(--border-color)'
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '0.8rem',
                                      fontWeight: 800,
                                      color: 'var(--text-heading)',
                                      marginBottom: '12px'
                                    }}
                                  >
                                    <History size={14} color="#EC4899" />
                                    <span>Full Cancellation Event Timeline for this Device</span>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {rec.cancellations.map((entry: any, eIdx: number) => (
                                      <div
                                        key={entry._id || eIdx}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '10px 12px',
                                          borderRadius: 'var(--radius-sm)',
                                          background: 'var(--bg-pill)',
                                          border: '1px solid var(--border-color)',
                                          fontSize: '0.78rem'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <span
                                            style={{
                                              fontWeight: 800,
                                              color: 'var(--text-dim)',
                                              padding: '2px 6px',
                                              borderRadius: '4px',
                                              background: 'var(--bg-panel)',
                                              fontSize: '0.7rem'
                                            }}
                                          >
                                            #{entry.cancellation_count || eIdx + 1}
                                          </span>
                                          <div>
                                            <span style={{ fontWeight: 700, color: '#F43F5E' }}>
                                              {entry.reason_text}
                                            </span>
                                            {entry.custom_feedback && (
                                              <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                                                — "{entry.custom_feedback}"
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                                            {entry.plan_name || 'Plan'} (${Number(entry.total_spent || 0).toFixed(2)})
                                          </span>
                                          <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                                            {new Date(entry.cancelled_at).toLocaleString([], {
                                              dateStyle: 'short',
                                              timeStyle: 'short'
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                <UserX size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>No cancellation entries recorded</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Exit survey feedback will appear here as users cancel in mobile apps.
                </div>
              </div>
            )}

            {/* Pagination Controls for Cancellations */}
            {cancelPagination.pages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}
              >
                <div>
                  Showing {Math.min((cancelPage - 1) * cancelLimit + 1, cancelPagination.total)} to{' '}
                  {Math.min(cancelPage * cancelLimit, cancelPagination.total)} of {cancelPagination.total} entries
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    disabled={cancelPage <= 1}
                    onClick={() => setCancelPage(p => Math.max(1, p - 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-pill)',
                      border: '1px solid var(--border-color)',
                      color: cancelPage <= 1 ? 'var(--text-dim)' : 'var(--text-main)',
                      cursor: cancelPage <= 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  {Array.from({ length: cancelPagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCancelPage(p)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: cancelPage === p ? '#F43F5E' : 'var(--bg-pill)',
                        color: cancelPage === p ? '#FFFFFF' : 'var(--text-main)',
                        fontWeight: cancelPage === p ? 800 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    disabled={cancelPage >= cancelPagination.pages}
                    onClick={() => setCancelPage(p => Math.min(cancelPagination.pages, p + 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-pill)',
                      border: '1px solid var(--border-color)',
                      color: cancelPage >= cancelPagination.pages ? 'var(--text-dim)' : 'var(--text-main)',
                      cursor: cancelPage >= cancelPagination.pages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PURCHASED & ACTIVE SUBSCRIPTIONS TABLE */}
        {activeTab === 'subscriptions' && (
          <div>
            {subsLoading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                Loading subscriptions database...
              </div>
            ) : subsData?.subscriptions && subsData.subscriptions.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-dim)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      <th style={{ padding: '12px 14px' }}>Subscriber / Device</th>
                      <th style={{ padding: '12px 14px' }}>Application</th>
                      <th style={{ padding: '12px 14px' }}>Plan / Product</th>
                      <th style={{ padding: '12px 14px' }}>Price</th>
                      <th style={{ padding: '12px 14px' }}>Purchase Date</th>
                      <th style={{ padding: '12px 14px' }}>Expiry Date</th>
                      <th style={{ padding: '12px 14px' }}>Auto-Renew</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subsData.subscriptions.map((sub: any) => {
                      const isExpired = sub.expiry_date && new Date(sub.expiry_date) < new Date();
                      const statusColor =
                        sub.status === 'ACTIVE' ? '#10B981' : sub.status === 'CANCELLED' ? '#F43F5E' : '#64748B';

                      return (
                        <tr
                          key={sub._id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* User / Device */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Smartphone size={15} color="var(--text-dim)" />
                              <div>
                                <div
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: 'var(--text-heading)'
                                  }}
                                >
                                  {sub.user_id?.device_unique_Id || sub._id?.substring(0, 16)}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-dim)',
                                    display: 'flex',
                                    gap: '6px',
                                    marginTop: '2px'
                                  }}
                                >
                                  <span>{sub.os_type || sub.user_id?.os_type || 'ANDROID'}</span>
                                  <span>•</span>
                                  <span>{sub.country || sub.user_id?.country || 'GLOBAL'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* App Name */}
                          <td style={{ padding: '14px' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--bg-pill)',
                                color: 'var(--text-main)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              {sub.app_id?.app_name || 'Application'}
                            </span>
                          </td>

                          {/* Plan Name & Product ID */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                              {sub.plan_name || sub.product_id}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              {sub.product_id}
                            </div>
                          </td>

                          {/* Amount */}
                          <td style={{ padding: '14px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10B981' }}>
                              ${Number(sub.amount || 0).toFixed(2)}{' '}
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                {sub.currency || 'USD'}
                              </span>
                            </span>
                          </td>

                          {/* Purchase Date */}
                          <td style={{ padding: '14px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {new Date(sub.purchase_date).toLocaleString([], {
                              dateStyle: 'medium'
                            })}
                          </td>

                          {/* Expiry Date */}
                          <td style={{ padding: '14px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {sub.expiry_date
                              ? new Date(sub.expiry_date).toLocaleString([], {
                                  dateStyle: 'medium'
                                })
                              : 'Never / Lifetime'}
                          </td>

                          {/* Auto Renew */}
                          <td style={{ padding: '14px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: sub.auto_renewing ? '#10B981' : 'var(--text-dim)'
                              }}
                            >
                              {sub.auto_renewing ? <CheckCircle size={13} /> : <XCircle size={13} />}
                              {sub.auto_renewing ? 'Active' : 'Off'}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 9px',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: `${statusColor}18`,
                                color: statusColor,
                                border: `1px solid ${statusColor}40`
                              }}
                            >
                              {sub.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                <CreditCard size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>No subscription purchases logged yet</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  In-App Purchases synced via RevenueCat webhook or client sync will be visible here.
                </div>
              </div>
            )}

            {/* Pagination Controls for Subscriptions */}
            {subPagination.pages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}
              >
                <div>
                  Showing {Math.min((subPage - 1) * subLimit + 1, subPagination.total)} to{' '}
                  {Math.min(subPage * subLimit, subPagination.total)} of {subPagination.total} entries
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    disabled={subPage <= 1}
                    onClick={() => setSubPage(p => Math.max(1, p - 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-pill)',
                      border: '1px solid var(--border-color)',
                      color: subPage <= 1 ? 'var(--text-dim)' : 'var(--text-main)',
                      cursor: subPage <= 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  {Array.from({ length: subPagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setSubPage(p)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: subPage === p ? 'var(--primary-color)' : 'var(--bg-pill)',
                        color: subPage === p ? '#FFFFFF' : 'var(--text-main)',
                        fontWeight: subPage === p ? 800 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    disabled={subPage >= subPagination.pages}
                    onClick={() => setSubPage(p => Math.min(subPagination.pages, p + 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-pill)',
                      border: '1px solid var(--border-color)',
                      color: subPage >= subPagination.pages ? 'var(--text-dim)' : 'var(--text-main)',
                      cursor: subPage >= subPagination.pages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
