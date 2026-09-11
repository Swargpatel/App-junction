import React, { useState, useEffect } from 'react';
import type { CrashLog } from '../types';
import api from '../api';
import { DateRangeFilter } from '../components/DateRangeFilter';
import {
  Bug,
  CheckCircle,
  RotateCcw,
  AlertOctagon,
  Terminal,
  Search,
  Filter,
  X,
  Smartphone,
  Clock,
  FileCode,
  Layers,
  Server,
  Send,
  Code,
  Database,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';

interface CrashDeskViewProps {
  selectedAppId: string;
}

export const CrashDeskView: React.FC<CrashDeskViewProps> = ({ selectedAppId }) => {
  const [logs, setLogs] = useState<CrashLog[]>([]);
  const [summary, setSummary] = useState<any>({
    pending: 0,
    in_progress: 0,
    resolved: 0,
    reopened: 0,
    backend_errors: 0,
    client_crashes: 0
  });
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'BACKEND_API' | 'CLIENT_APP'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedError, setSelectedError] = useState<CrashLog | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [selectedAppId, sourceFilter, statusFilter, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/crash', {
        params: {
          app_id: selectedAppId,
          source: sourceFilter,
          status: statusFilter,
          search,
          startDate,
          endDate
        }
      });
      if (res.data.success) {
        setLogs(res.data.logs);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error('Error fetching crash logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/admin/crash/${id}/status`, {
        status: newStatus,
        resolution_notes: resolutionNotes || `Bug marked as ${newStatus}`
      });
      setSelectedError(null);
      setResolutionNotes('');
      fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-heading)' }}>Crash & API Error Desk</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time backend failed API logs, request payloads, response bodies, mobile crashes, and resolution workflows
          </p>
        </div>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
        />
      </div>

      {/* Source Switcher Tabs & Status Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Source Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-card)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <button
              onClick={() => setSourceFilter('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: sourceFilter === 'ALL' ? 'var(--primary)' : 'transparent',
                color: sourceFilter === 'ALL' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              🌐 All Failures
            </button>
            <button
              onClick={() => setSourceFilter('BACKEND_API')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: sourceFilter === 'BACKEND_API' ? 'var(--primary)' : 'transparent',
                color: sourceFilter === 'BACKEND_API' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <Server size={14} />
              <span>Backend API Errors ({summary.backend_errors || 0})</span>
            </button>
            <button
              onClick={() => setSourceFilter('CLIENT_APP')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: sourceFilter === 'CLIENT_APP' ? 'var(--primary)' : 'transparent',
                color: sourceFilter === 'CLIENT_APP' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <Smartphone size={14} />
              <span>Mobile App Crashes ({summary.client_crashes || 0})</span>
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            Showing {logs.length} error{logs.length === 1 ? '' : 's'} recorded
          </div>
        </div>

        {/* Status Summary Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className="stat-card"
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              padding: '16px 20px',
              border: statusFilter === 'PENDING' ? '1.5px solid #F59E0B' : '1px solid var(--border-color)',
              outline: 'none'
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' }}>
              Pending
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '2px' }}>
              {summary.pending || 0}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('REOPENED')}
            className="stat-card"
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              padding: '16px 20px',
              border: statusFilter === 'REOPENED' ? '1.5px solid #F43F5E' : '1px solid var(--border-color)',
              outline: 'none'
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F43F5E', textTransform: 'uppercase' }}>
              Reopened
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F43F5E', marginTop: '2px' }}>
              {summary.reopened || 0}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className="stat-card"
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              padding: '16px 20px',
              border: statusFilter === 'IN_PROGRESS' ? '1.5px solid #6366F1' : '1px solid var(--border-color)',
              outline: 'none'
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase' }}>
              In Progress
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '2px' }}>
              {summary.in_progress || 0}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className="stat-card"
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              padding: '16px 20px',
              border: statusFilter === 'RESOLVED' ? '1.5px solid #10B981' : '1px solid var(--border-color)',
              outline: 'none'
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
              Resolved
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
              {summary.resolved || 0}
            </div>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
          <input
            type="text"
            placeholder="Search by API endpoint, error message, payload, or method..."
            className="input-control"
            style={{ paddingLeft: '40px', height: '42px', fontSize: '0.88rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
          />
        </div>
        <button
          onClick={() => {
            setSourceFilter('ALL');
            setStatusFilter('ALL');
            setSearch('');
          }}
          className="btn btn-secondary"
          style={{ height: '42px', fontWeight: 600 }}
        >
          Reset Filter
        </button>
      </div>

      {/* Crash Logs Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Error Details & Route</th>
              <th>Source</th>
              <th>App / Scope</th>
              <th>Status / Severity</th>
              <th>Occurrences</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th style={{ textAlign: 'right' }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                  Loading error logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  <Bug size={36} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>No error logs found for this filter.</div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isBackend = log.error_source === 'BACKEND_API';
                return (
                  <tr key={log._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ marginTop: '2px' }}>
                          <AlertOctagon size={16} color={log.status === 'REOPENED' ? '#F43F5E' : log.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isBackend && log.http_method && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background:
                                    log.http_method === 'POST' ? 'rgba(99, 102, 241, 0.15)' :
                                    log.http_method === 'GET' ? 'rgba(16, 185, 129, 0.15)' :
                                    log.http_method === 'DELETE' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color:
                                    log.http_method === 'POST' ? '#6366F1' :
                                    log.http_method === 'GET' ? '#10B981' :
                                    log.http_method === 'DELETE' ? '#F43F5E' : '#F59E0B',
                                  fontWeight: 800
                                }}
                              >
                                {log.http_method}
                              </span>
                            )}
                            <span>{log.endpoint || log.error_title}</span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              marginTop: '3px',
                              maxWidth: '400px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            className="font-mono"
                          >
                            {log.error_message}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isBackend ? 'rgba(99, 102, 241, 0.12)' : 'rgba(236, 72, 153, 0.12)',
                          color: isBackend ? '#6366F1' : '#EC4899',
                          border: isBackend ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(236, 72, 153, 0.25)'
                        }}
                      >
                        {isBackend ? '⚡ BACKEND' : '📱 CLIENT'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-pill)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)'
                        }}
                      >
                        {log.app_id?.app_name || (isBackend ? 'System / Multi-App' : 'Application')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isBackend && log.status_code && (
                          <span
                            className="font-mono"
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              color: log.status_code >= 500 ? '#F43F5E' : '#F59E0B'
                            }}
                          >
                            HTTP {log.status_code}
                          </span>
                        )}
                        <span className={`badge badge-${log.severity?.toLowerCase() || 'high'}`}>{log.severity}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          color: log.occurrences_count > 1 ? '#EC4899' : 'var(--text-heading)',
                          background: log.occurrences_count > 1 ? 'rgba(236, 72, 153, 0.12)' : 'var(--bg-pill)',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {log.occurrences_count}x
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${log.status.toLowerCase()}`}>{log.status}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {new Date(log.last_seen_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedError(log)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        <Terminal size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect & Resolve Modal with Request Payload and Response Body */}
      {selectedError && (
        <div className="modal-overlay" onClick={() => setSelectedError(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '0',
              maxWidth: '840px',
              width: '95%',
              maxHeight: '90vh',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-modal)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header (Fixed at top) */}
            <div style={{ padding: '22px 28px 16px 28px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: selectedError.error_source === 'BACKEND_API' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                        color: selectedError.error_source === 'BACKEND_API' ? '#6366F1' : '#EC4899',
                        border: '1px solid currentColor'
                      }}
                    >
                      {selectedError.error_source === 'BACKEND_API' ? '⚡ BACKEND API FAILURE' : '📱 MOBILE CRASH'}
                    </span>
                    <span className={`badge badge-${selectedError.status.toLowerCase()}`}>
                      {selectedError.status}
                    </span>
                    <span className={`badge badge-${selectedError.severity?.toLowerCase() || 'high'}`}>
                      {selectedError.severity}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {selectedError.occurrences_count} Occurrence{selectedError.occurrences_count > 1 ? 's' : ''}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedError.http_method && (
                      <span style={{ color: '#6366F1', fontSize: '1rem', fontWeight: 800 }}>
                        {selectedError.http_method}
                      </span>
                    )}
                    <span>{selectedError.endpoint || selectedError.error_title}</span>
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedError(null)}
                  style={{
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-dim)'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* API Route Overview Card */}
              {selectedError.error_source === 'BACKEND_API' && (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '12px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                      HTTP Status Code
                    </span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: (selectedError.status_code || 500) >= 500 ? '#EF4444' : '#F59E0B' }}>
                      HTTP {selectedError.status_code || 500}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Target App
                    </span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                      {selectedError.app_id?.app_name || 'System / All Apps'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Client IP
                    </span>
                    <div className="font-mono" style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      {selectedError.ip_address || '127.0.0.1'}
                    </div>
                  </div>
                </div>
              )}

              {/* 1. Request Payload (What user sent) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Send size={13} color="#6366F1" />
                    <span>User Request Payload (Body Sent by Client)</span>
                  </label>
                  {selectedError.request_payload && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(selectedError.request_payload, null, 2), 'payload')}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                    >
                      {copiedSection === 'payload' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      <span>{copiedSection === 'payload' ? 'Copied' : 'Copy Payload'}</span>
                    </button>
                  )}
                </div>
                <pre
                  className="font-mono"
                  style={{
                    background: 'var(--bg-code-box)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    color: '#38BDF8',
                    fontSize: '0.78rem',
                    overflowX: 'auto',
                    maxHeight: '180px',
                    border: '1px solid var(--border-color)',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {selectedError.request_payload
                    ? JSON.stringify(selectedError.request_payload, null, 2)
                    : '// No Request Body Payload Sent'}
                </pre>
              </div>

              {/* 2. Request Query Params (if any) */}
              {selectedError.request_query && Object.keys(selectedError.request_query).length > 0 && (
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '6px', display: 'block' }}>
                    URL Query Parameters
                  </label>
                  <pre
                    className="font-mono"
                    style={{
                      background: 'var(--bg-code-box)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      color: '#A5B4FC',
                      fontSize: '0.76rem',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {JSON.stringify(selectedError.request_query, null, 2)}
                  </pre>
                </div>
              )}

              {/* 3. Server Failed Response (Returned to User) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', color: '#F43F5E', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertOctagon size={13} color="#F43F5E" />
                    <span>Failed Response (Returned to User)</span>
                  </label>
                  {selectedError.response_body && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(selectedError.response_body, null, 2), 'response')}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                    >
                      {copiedSection === 'response' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      <span>{copiedSection === 'response' ? 'Copied' : 'Copy Response'}</span>
                    </button>
                  )}
                </div>
                <pre
                  className="font-mono"
                  style={{
                    background: 'var(--bg-error-box)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    color: 'var(--text-error-box)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    overflowX: 'auto',
                    maxHeight: '160px',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {selectedError.response_body
                    ? JSON.stringify(selectedError.response_body, null, 2)
                    : selectedError.error_message}
                </pre>
              </div>

              {/* 4. Error Message / Summary */}
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                  Error Summary
                </label>
                <div
                  className="font-mono"
                  style={{
                    background: 'var(--bg-card)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    border: '1px solid var(--border-color)',
                    marginTop: '6px',
                    wordBreak: 'break-word',
                    lineHeight: '1.5'
                  }}
                >
                  {selectedError.error_message}
                </div>
              </div>

              {/* 5. Stack Trace Box (if captured) */}
              {selectedError.stack_trace && (
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '6px', display: 'block' }}>
                    Server Stack Trace
                  </label>
                  <pre
                    className="font-mono"
                    style={{
                      background: 'var(--bg-code-box)',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      color: 'var(--text-code)',
                      fontSize: '0.76rem',
                      overflowX: 'auto',
                      maxHeight: '160px',
                      border: '1px solid var(--border-color)',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}
                  >
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}

              {/* Resolution Notes Input */}
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                  RESOLUTION NOTES
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fixed input validation in clientController.js line 45"
                  className="input-control"
                  style={{ marginTop: '6px', height: '42px', fontSize: '0.85rem' }}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Actions (Fixed at bottom) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 28px',
                borderTop: '1px solid var(--border-color)',
                flexShrink: 0,
                background: 'var(--bg-modal)'
              }}
            >
              <button onClick={() => setSelectedError(null)} className="btn btn-secondary">
                Close
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleUpdateStatus(selectedError._id, 'IN_PROGRESS')}
                  className="btn btn-secondary"
                  style={{ fontWeight: 700 }}
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedError._id, 'RESOLVED')}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)', fontWeight: 800, gap: '6px' }}
                >
                  <CheckCircle size={15} />
                  <span>Mark as Resolved</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
