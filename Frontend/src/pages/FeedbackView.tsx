import React, { useState, useEffect } from 'react';
import type { FeedbackItem } from '../types';
import api from '../api';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { Star, MessageSquare, CheckCircle, Smartphone } from 'lucide-react';

interface FeedbackViewProps {
  selectedAppId: string;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ selectedAppId }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, [selectedAppId, startDate, endDate]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/feedback', {
        params: {
          app_id: selectedAppId,
          startDate,
          endDate
        }
      });
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks);
        setAverageRating(res.data.average_rating);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/admin/feedback/${id}/status`, { status: newStatus });
      fetchFeedback();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-heading)' }}>User Feedback & Ratings</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time star ratings and feedback sent directly from mobile applications
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

      {/* Hero Feedback Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="stat-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Average App Rating
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FBBF24' }}>
              {total > 0 ? averageRating.toFixed(1) : '0.0'}
            </div>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  fill={total > 0 && s <= Math.round(averageRating) ? '#FBBF24' : 'transparent'}
                  color="#FBBF24"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total User Reviews
          </span>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '6px' }}>
            {total}
          </div>
        </div>
      </div>

      {/* Feedback Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {feedbacks.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            No user feedback submitted yet.
          </div>
        ) : (
          feedbacks.map((fb) => (
            <div
              key={fb._id}
              className="glass-panel"
              style={{
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        fill={s <= fb.rating ? '#FBBF24' : 'transparent'}
                        color="#FBBF24"
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>•</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818CF8' }}>
                    {fb.app_id?.app_name}
                  </span>
                  {fb.user_email && (
                    <>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>•</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fb.user_email}</span>
                    </>
                  )}
                </div>

                <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  "{fb.feedback_text}"
                </p>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', gap: '12px' }}>
                  <span>App: v{fb.app_version || '1.0.0'}</span>
                  <span>Country: {fb.user_id?.country || 'Global'}</span>
                  <span>Date: {new Date(fb.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <span className={`badge badge-${fb.status === 'NEW' ? 'pending' : 'resolved'}`}>
                  {fb.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
