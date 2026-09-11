import React, { useState, useEffect } from 'react';
import type { App, Group, CrossMarketingCampaign } from '../types';
import api from '../api';
import { Plus, Megaphone, Eye, MousePointerClick, TrendingUp, Power, Trash2 } from 'lucide-react';

interface CrossMarketingViewProps {
  apps: App[];
  groups: Group[];
}

export const CrossMarketingView: React.FC<CrossMarketingViewProps> = ({ apps, groups }) => {
  const [campaigns, setCampaigns] = useState<CrossMarketingCampaign[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [destinationAppId, setDestinationAppId] = useState('');
  const [sourceAppId, setSourceAppId] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [buttonText, setButtonText] = useState('Install Free');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/admin/cross-marketing');
      if (res.data.success) {
        setCampaigns(res.data.campaigns);
      }
    } catch (err) {
      console.error('Error fetching cross-marketing:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !destinationAppId || !posterUrl) return;

    setLoading(true);
    try {
      const res = await api.post('/admin/cross-marketing/create', {
        title,
        destination_app_id: destinationAppId,
        source_app_id: sourceAppId || null,
        poster_image_url: posterUrl,
        target_button_text: buttonText
      });

      if (res.data.success) {
        setShowModal(false);
        setTitle('');
        setPosterUrl('');
        fetchCampaigns();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.put(`/admin/cross-marketing/${id}/toggle`);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this cross-marketing poster campaign?')) return;
    try {
      await api.delete(`/admin/cross-marketing/${id}`);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF' }}>Cross-Marketing Hub</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Promote apps across your portfolio with targeted in-app posters, banners, and live CTR tracking
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Setup Marketing Poster</span>
        </button>
      </div>

      {/* Campaign Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {campaigns.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-dim)' }}>
            No cross marketing campaigns yet. Click "Setup Marketing Poster" to cross-promote your applications.
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp._id}
              className="glass-panel"
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* Poster Preview */}
              <div
                style={{
                  height: '160px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.4)',
                  position: 'relative',
                  border: '1px solid var(--border-color)'
                }}
              >
                <img
                  src={camp.poster_image_url}
                  alt={camp.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60';
                  }}
                />
                <span
                  className={`badge badge-${camp.status === 'ACTIVE' ? 'active' : 'pending'}`}
                  style={{ position: 'absolute', top: '10px', right: '10px' }}
                >
                  {camp.status}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>{camp.title}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Promoting: <strong style={{ color: '#818CF8' }}>{camp.destination_app_id?.app_name}</strong>
                </div>
              </div>

              {/* Impressions & Clicks & CTR */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-pill)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Views</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '2px' }}>
                    {camp.impressions_count}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Clicks</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
                    {camp.clicks_count}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>CTR</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#EC4899', marginTop: '2px' }}>
                    {camp.ctr_percent || 0}%
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => handleToggle(camp._id)}
                  className={`btn btn-sm ${camp.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}`}
                >
                  <Power size={13} />
                  <span>{camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Activate'}</span>
                </button>
                <button onClick={() => handleDelete(camp._id)} className="btn btn-danger btn-sm">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Setup Poster Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
              Create Marketing Poster Campaign
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Display promotion banners across applications to drive downloads to your destination app.
            </p>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Campaign Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Try our Love Calculator!"
                  className="input-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Destination App (To Promote) *
                  </label>
                  <select
                    className="input-control"
                    value={destinationAppId}
                    onChange={(e) => setDestinationAppId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Destination App --</option>
                    {apps.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.app_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Display Inside (Source App)
                  </label>
                  <select
                    className="input-control"
                    value={sourceAppId}
                    onChange={(e) => setSourceAppId(e.target.value)}
                  >
                    <option value="">All Applications in Portfolio</option>
                    {apps.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.app_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Poster Banner Image URL *
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/poster.jpg"
                  className="input-control"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Action Button Label
                </label>
                <input
                  type="text"
                  placeholder="Install Now"
                  className="input-control"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Creating...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
