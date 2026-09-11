import React from 'react';
import type { DashboardOverview, RevenueTrendItem } from '../types';
import { Download, Users, DollarSign, Activity, Globe, ArrowUpRight } from 'lucide-react';

interface DashboardViewProps {
  overview: DashboardOverview | null;
  revenueTrends: RevenueTrendItem[];
  userDistribution: { countries: any[]; os: any[] };
  selectedAppName: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  revenueTrends,
  userDistribution,
  selectedAppName
}) => {
  if (!overview) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading analytics dashboard...</div>;
  }

  // Calculate SVG chart coordinates for revenue trend
  const maxRevenue = Math.max(...revenueTrends.map((t) => t.total_revenue), 10);
  const chartHeight = 180;
  const chartWidth = 600;

  const points = revenueTrends.map((item, index) => {
    const x = (index / Math.max(revenueTrends.length - 1, 1)) * chartWidth;
    const y = chartHeight - (item.total_revenue / maxRevenue) * (chartHeight - 30) - 15;
    return `${x},${y}`;
  });

  const pathData = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaData =
    points.length > 0
      ? `M 0,${chartHeight} L ${points.join(' L ')} L ${chartWidth},${chartHeight} Z`
      : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Scope Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF' }}>Executive Analytics</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing performance metrics for: <span style={{ color: '#818CF8', fontWeight: 600 }}>{selectedAppName}</span>
          </p>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Card 1: Installs */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Installations
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
                {overview.total_installs.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Download size={20} color="#818CF8" />
            </div>
          </div>
          <div style={{ marginTop: '14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#34D399', fontWeight: 700 }}>+{overview.today_installs} New</span>
            <span style={{ color: 'var(--text-dim)' }}>joined today</span>
          </div>
        </div>

        {/* Card 2: Repeat Users */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Repeat Customers
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
                {overview.repeat_customers.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Users size={20} color="#34D399" />
            </div>
          </div>
          <div style={{ marginTop: '14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#818CF8', fontWeight: 700 }}>
              {overview.total_installs > 0
                ? ((overview.repeat_customers / overview.total_installs) * 100).toFixed(1)
                : 0}
              %
            </span>
            <span style={{ color: 'var(--text-dim)' }}>retention rate</span>
          </div>
        </div>

        {/* Card 3: Today's Revenue */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Today's Total Revenue
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
                ${overview.today_revenue.toFixed(2)}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DollarSign size={20} color="#10B981" />
            </div>
          </div>
          <div style={{ marginTop: '14px', fontSize: '0.75rem', display: 'flex', gap: '10px', color: 'var(--text-dim)' }}>
            <span>Sub: <strong style={{ color: '#FFF' }}>${overview.today_subscription_revenue.toFixed(2)}</strong></span>
            <span>•</span>
            <span>Consumable: <strong style={{ color: '#FFF' }}>${overview.today_consumable_revenue.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Card 4: Active Subscriptions */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active Subscriptions
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#EC4899', marginTop: '6px' }}>
                {overview.active_subscriptions}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(236, 72, 153, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Activity size={20} color="#EC4899" />
            </div>
          </div>
          <div style={{ marginTop: '14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-dim)' }}>All-time total:</span>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>${overview.all_time_revenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Grid: Revenue Chart & Country Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
        {/* Revenue Trends Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>Revenue Trajectory</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Daily revenue breakdown across applications</p>
            </div>
            <span className="badge badge-active">Live Sync</span>
          </div>

          {/* SVG Line / Area Chart */}
          <div style={{ position: 'relative', width: '100%', height: `${chartHeight}px`, overflow: 'hidden' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2={chartWidth} y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2={chartWidth} y2="150" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

              {/* Filled Area */}
              {areaData && <path d={areaData} fill="url(#revenueGrad)" />}

              {/* Stroke Curve */}
              {pathData && (
                <path d={pathData} fill="none" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
              )}

              {/* Points */}
              {points.map((pt, i) => {
                const [cx, cy] = pt.split(',');
                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill="#EC4899"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <span>{revenueTrends[0]?._id || 'Start'}</span>
            <span>{revenueTrends[Math.floor(revenueTrends.length / 2)]?._id || 'Mid'}</span>
            <span>{revenueTrends[revenueTrends.length - 1]?._id || 'Today'}</span>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Globe size={18} color="#818CF8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>Top Countries</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {userDistribution.countries.slice(0, 5).map((c, i) => {
              const totalUsers = overview.total_installs || 1;
              const percent = Math.round((c.users_count / totalUsers) * 100);
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{c._id}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {c.users_count} users ({percent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: 'linear-gradient(90deg, #6366F1, #EC4899)',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
