import React, { useState } from 'react';
import type { Group, App as AppType } from '../types';
import api from '../api';
import {
  Plus,
  FolderKanban,
  Trash2,
  Edit3,
  Smartphone,
  Check,
  Search,
  CheckSquare,
  Square,
  Layers,
  Sparkles
} from 'lucide-react';

interface GroupsViewProps {
  groups: Group[];
  apps?: AppType[];
  onRefresh: () => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ groups, apps = [], onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [colorCode, setColorCode] = useState('#6366F1');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const colorPalette = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#06B6D4'  // Cyan
  ];

  const handleOpenCreateModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setDescription('');
    setColorCode('#6366F1');
    setSelectedAppIds([]);
    setAppSearchQuery('');
    setShowModal(true);
  };

  const handleOpenEditModal = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.group_name);
    setDescription(group.description || '');
    setColorCode(group.color_code || '#6366F1');
    
    // Pre-select apps currently belonging to this group
    const currentGroupAppIds = apps
      .filter((a) => {
        const gId = typeof a.group_id === 'object' && a.group_id ? (a.group_id as any)._id : a.group_id;
        return gId === group._id;
      })
      .map((a) => a._id);

    setSelectedAppIds(currentGroupAppIds);
    setAppSearchQuery('');
    setShowModal(true);
  };

  const toggleAppSelection = (appId: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleSelectAllApps = () => {
    setSelectedAppIds(filteredApps.map((a) => a._id));
  };

  const handleDeselectAllApps = () => {
    setSelectedAppIds([]);
  };

  const filteredApps = apps.filter((app) => {
    if (!appSearchQuery.trim()) return true;
    const q = appSearchQuery.toLowerCase();
    return (
      app.app_name?.toLowerCase().includes(q) ||
      app.package_name?.toLowerCase().includes(q)
    );
  });

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    try {
      if (editingGroup) {
        // Update existing group
        await api.put(`/admin/groups/${editingGroup._id}`, {
          group_name: groupName.trim(),
          description,
          color_code: colorCode,
          app_ids: selectedAppIds
        });
      } else {
        // Create new group
        await api.post('/admin/groups', {
          group_name: groupName.trim(),
          description,
          color_code: colorCode,
          app_ids: selectedAppIds
        });
      }

      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this group? (Groups with assigned apps cannot be deleted).')) {
      return;
    }

    try {
      await api.delete(`/admin/groups/${groupId}`);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete group');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF' }}>Application Groups</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Cluster common applications into functional marketing & analytics groups (e.g. Love apps, Utility apps)
          </p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary" id="btn-create-group">
          <Plus size={18} />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {groups.map((group) => {
          // Find apps assigned to this group
          const assignedApps = apps.filter((a) => {
            const gId = typeof a.group_id === 'object' && a.group_id ? (a.group_id as any)._id : a.group_id;
            return gId === group._id;
          });

          return (
            <div
              key={group._id}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `4px solid ${group.color_code}`,
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${group.color_code}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${group.color_code}44`
                      }}
                    >
                      <FolderKanban size={20} color={group.color_code} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>{group.group_name}</h3>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: `${group.color_code}18`,
                          color: group.color_code,
                          fontWeight: 600
                        }}
                      >
                        {assignedApps.length || group.app_count || 0} Apps Assigned
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEditModal(group)}
                      className="btn btn-secondary btn-sm"
                      title="Edit Group & Assigned Apps"
                      style={{ padding: '6px 8px' }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group._id)}
                      className="btn btn-danger btn-sm"
                      title="Delete Group"
                      style={{ padding: '6px 8px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '14px', lineHeight: '1.5' }}>
                  {group.description || 'No description provided'}
                </p>

                {/* Assigned Apps Badges */}
                {assignedApps.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px' }}>
                      Included Applications:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {assignedApps.slice(0, 4).map((app) => (
                        <div
                          key={app._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--bg-pill)',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-color)',
                            fontWeight: 600
                          }}
                        >
                          <Smartphone size={13} color={group.color_code} />
                          <span>{app.app_name}</span>
                        </div>
                      ))}
                      {assignedApps.length > 4 && (
                        <div
                          style={{
                            padding: '5px 9px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-pill)',
                            border: '1px solid var(--border-color)',
                            fontWeight: 600
                          }}
                        >
                          +{assignedApps.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '22px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <Layers size={14} />
                  <span>Cluster Pool:</span>
                </div>
                <button
                  onClick={() => handleOpenEditModal(group)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: group.color_code,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Manage Apps →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Group Modal with Multiple App Selection */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '28px', maxWidth: '580px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {editingGroup ? 'Edit Application Group' : 'Create Application Group'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Groups allow you to cluster applications for unified push campaigns and cross-marketing.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitGroup} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '16px' }}>
              {/* Group Name */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Love & Romance Apps, Utility Tools"
                  className="input-control"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of applications in this group..."
                  className="input-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Color Badge */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Color Badge
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {colorPalette.map((color) => (
                    <div
                      key={color}
                      onClick={() => setColorCode(color)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: color,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: colorCode === color ? '2px solid #FFFFFF' : '2px solid transparent',
                        boxShadow: colorCode === color ? `0 0 12px ${color}` : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {colorCode === color && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Multiple Application Selection Section */}
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Smartphone size={16} color={colorCode} />
                      <span>Select Applications</span>
                    </label>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Choose multiple applications to assign into this group
                    </span>
                  </div>
                  <span
                    style={{
                      background: selectedAppIds.length > 0 ? `${colorCode}22` : 'rgba(255, 255, 255, 0.06)',
                      color: selectedAppIds.length > 0 ? colorCode : 'var(--text-muted)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      border: `1px solid ${selectedAppIds.length > 0 ? `${colorCode}44` : 'transparent'}`
                    }}
                  >
                    {selectedAppIds.length} Selected
                  </span>
                </div>

                {/* Search & Select All Controls */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={14}
                      color="var(--text-muted)"
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      placeholder="Search applications..."
                      className="input-control"
                      value={appSearchQuery}
                      onChange={(e) => setAppSearchQuery(e.target.value)}
                      style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '36px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllApps}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllApps}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  >
                    Clear
                  </button>
                </div>

                {/* Applications Scrollable List */}
                <div
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    paddingRight: '4px'
                  }}
                >
                  {filteredApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {apps.length === 0
                        ? 'No applications registered yet. You can create apps first in the Applications tab.'
                        : 'No applications match your search query.'}
                    </div>
                  ) : (
                    filteredApps.map((app) => {
                      const isSelected = selectedAppIds.includes(app._id);
                      const currentGroupName = typeof app.group_id === 'object' && app.group_id
                        ? (app.group_id as any).group_name
                        : groups.find((g) => g._id === app.group_id)?.group_name;

                      return (
                        <div
                          key={app._id}
                          onClick={() => toggleAppSelection(app._id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-pill)',
                            border: `1px solid ${isSelected ? colorCode : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ color: isSelected ? colorCode : 'var(--text-muted)' }}>
                              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                {app.app_name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {app.package_name}
                              </div>
                            </div>
                          </div>

                          <div>
                            {currentGroupName ? (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: 'var(--bg-card)',
                                  color: 'var(--text-dim)',
                                  border: '1px solid var(--border-color)'
                                }}
                              >
                                {currentGroupName}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Unassigned</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" id="btn-submit-group">
                  {loading
                    ? 'Saving...'
                    : editingGroup
                    ? `Update Group (${selectedAppIds.length} Apps)`
                    : `Create Group (${selectedAppIds.length} Apps)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

