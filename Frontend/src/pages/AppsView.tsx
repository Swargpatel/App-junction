import React, { useState } from 'react';
import type { App, Group } from '../types';
import api from '../api';
import {
  Plus,
  Smartphone,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Globe,
  Bell,
  Settings,
  ShieldAlert,
  ExternalLink,
  Edit3,
  X,
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface AppsViewProps {
  apps: App[];
  groups: Group[];
  onRefresh: () => void;
}

export const AppsView: React.FC<AppsViewProps> = ({ apps, groups, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'stores' | 'marketing' | 'policy'>('basic');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });

  // Form State (Exact mapping to tbl_app in Excel sheet)
  const [appName, setAppName] = useState('');
  const [androidPackage, setAndroidPackage] = useState('');
  const [iosBundleId, setIosBundleId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [platform, setPlatform] = useState<'ANDROID' | 'IOS' | 'BOTH'>('ANDROID');
  const [ageRating, setAgeRating] = useState('3+');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [androidBuild, setAndroidBuild] = useState('1');
  const [iosBuild, setIosBuild] = useState('1');

  // Stores & Accounts
  const [googleplayLink, setGoogleplayLink] = useState('');
  const [appstoreLink, setAppstoreLink] = useState('');
  const [googlePlayAccount, setGooglePlayAccount] = useState('');
  const [appleStoreAccount, setAppleStoreAccount] = useState('');
  const [adsAccount, setAdsAccount] = useState('');

  // Push & Marketing
  const [firebaseConfigMode, setFirebaseConfigMode] = useState<'JSON' | 'KEY'>('JSON');
  const [firebasePushKey, setFirebasePushKey] = useState('');
  const [firebaseServiceAccountJson, setFirebaseServiceAccountJson] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseClientEmail, setFirebaseClientEmail] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const [isPushMarketing, setIsPushMarketing] = useState(true);
  const [isCrossPushMarketing, setIsCrossPushMarketing] = useState(true);
  const [isCrossAppAdsBanner, setIsCrossAppAdsBanner] = useState(true);
  const [ownNotificationTime, setOwnNotificationTime] = useState('20:00');
  const [crossNotificationTime, setCrossNotificationTime] = useState('20:00');
  const [ownNotificationFreq, setOwnNotificationFreq] = useState('1');
  const [crossNotificationFreq, setCrossNotificationFreq] = useState('2');

  // Media & Policy
  const [androidAdsPolicyUrl, setAndroidAdsPolicyUrl] = useState('');
  const [iosAdsPolicyUrl, setIosAdsPolicyUrl] = useState('');
  const [androidVideoUrl, setAndroidVideoUrl] = useState('');
  const [iosVideoUrl, setIosVideoUrl] = useState('');

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.project_id || !parsed.private_key) {
          setJsonError('Invalid JSON: Must contain "project_id" and "private_key" from Firebase Console.');
          return;
        }
        setFirebaseServiceAccountJson(text);
        setFirebaseProjectId(parsed.project_id || '');
        setFirebaseClientEmail(parsed.client_email || '');
        setJsonError(null);
      } catch (err: any) {
        setJsonError('Failed to parse JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleJsonTextChange = (text: string) => {
    setFirebaseServiceAccountJson(text);
    if (!text.trim()) {
      setFirebaseProjectId('');
      setFirebaseClientEmail('');
      setJsonError(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (parsed.project_id && parsed.private_key) {
        setFirebaseProjectId(parsed.project_id);
        setFirebaseClientEmail(parsed.client_email || '');
        setJsonError(null);
      } else {
        setFirebaseProjectId('');
        setFirebaseClientEmail('');
        setJsonError('JSON must contain "project_id" and "private_key".');
      }
    } catch {
      setFirebaseProjectId('');
      setFirebaseClientEmail('');
      setJsonError('Invalid JSON syntax');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setEditingAppId(null);
    setActiveTab('basic');
    setSaveError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (app: App) => {
    setEditingAppId(app._id);
    setAppName(app.app_name || '');
    setAndroidPackage(app.android_package_name || app.package_name || '');
    setIosBundleId(app.ios_bundle_id || '');
    
    // Group extraction
    const gId = typeof app.group_id === 'object' && app.group_id !== null ? (app.group_id as Group)._id : (app.group_id as string) || '';
    setGroupId(gId);
    
    setPlatform((app.platform as any) || 'ANDROID');
    setAgeRating(app.app_age_rating || '3+');
    setAppVersion(app.app_version || '1.0.0');
    setAndroidBuild(app.android_latest_build_number || '1');
    setIosBuild(app.ios_latest_build_number || '1');

    // Stores
    setGoogleplayLink(app.googleplay_link || app.store_url_android || '');
    setAppstoreLink(app.appstore_link || app.store_url_ios || '');
    setGooglePlayAccount(app.google_play_account || '');
    setAppleStoreAccount(app.apple_app_store_account || '');
    setAdsAccount(app.ads_account || '');

    // Push & Marketing
    setFirebasePushKey(app.Firebase_push_key || app.firebase_server_key || '');
    setFirebaseServiceAccountJson(app.firebase_service_account_json || '');
    setFirebaseProjectId(app.firebase_project_id || '');
    setFirebaseClientEmail(app.firebase_client_email || '');
    if (app.firebase_service_account_json) {
      setFirebaseConfigMode('JSON');
    } else if (app.Firebase_push_key || app.firebase_server_key) {
      setFirebaseConfigMode('KEY');
    } else {
      setFirebaseConfigMode('JSON');
    }
    setJsonError(null);
    setShowRawJson(false);

    setIsPushMarketing(app.is_push_marketing !== undefined ? app.is_push_marketing : true);
    setIsCrossPushMarketing(app.is_cross_push_marketing !== undefined ? app.is_cross_push_marketing : true);
    setIsCrossAppAdsBanner(app.is_cross_app_ads_banner_marketing !== undefined ? app.is_cross_app_ads_banner_marketing : true);
    setOwnNotificationTime(app.Own_notification_timePrefrance || '20:00');
    setCrossNotificationTime(app.Cross_app_notification_time_prefrance || '20:00');
    setOwnNotificationFreq(app.Own_app_notification_frequancy || '1');
    setCrossNotificationFreq(app.Cross_app_notification_frequancy || '2');

    // Media & Policy
    setAndroidAdsPolicyUrl(app.Android_ads_policy_URL || '');
    setIosAdsPolicyUrl(app.iOS_ads_policy_URL || '');
    setAndroidVideoUrl(app.android_video_url || '');
    setIosVideoUrl(app.ios_video_url || '');

    setActiveTab('basic');
    setShowModal(true);
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Full field-level validation ---
    const errors: Record<string, string> = {};

    // App Name
    if (!appName.trim()) {
      errors.appName = 'Application name is required.';
    } else if (appName.trim().length < 2) {
      errors.appName = 'Application name must be at least 2 characters.';
    }

    // Package / Bundle – platform-aware
    const needsAndroid = platform === 'ANDROID' || platform === 'BOTH';
    const needsIos = platform === 'IOS' || platform === 'BOTH';
    const androidPkgPattern = /^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*){1,}$/;
    const iosBundlePattern = /^[a-zA-Z][a-zA-Z0-9\-]*(?:\.[a-zA-Z0-9\-]+){1,}$/;

    if (needsAndroid && !androidPackage.trim()) {
      errors.androidPackage = `Android Package Name is required for platform "${platform}".`;
    } else if (androidPackage.trim() && !androidPkgPattern.test(androidPackage.trim())) {
      errors.androidPackage = 'Invalid format. Expected: com.example.app (at least two dot-separated segments).';
    }

    if (needsIos && !iosBundleId.trim()) {
      errors.iosBundleId = `iOS Bundle ID is required for platform "${platform}".`;
    } else if (iosBundleId.trim() && !iosBundlePattern.test(iosBundleId.trim())) {
      errors.iosBundleId = 'Invalid format. Expected: com.example.app (at least two dot-separated segments).';
    }

    if (!needsAndroid && !needsIos && !androidPackage.trim() && !iosBundleId.trim()) {
      errors.androidPackage = 'Provide at least one platform identifier: Android Package Name or iOS Bundle ID.';
    }

    // Version
    const semverPattern = /^\d+\.\d+(\.\d+)?$/;
    if (appVersion.trim() && !semverPattern.test(appVersion.trim())) {
      errors.appVersion = 'Version must follow format: 1.0 or 1.0.0';
    }

    // Build numbers – must be positive integers
    if (androidBuild.trim() && (isNaN(Number(androidBuild)) || Number(androidBuild) < 1)) {
      errors.androidBuild = 'Android build number must be a positive integer.';
    }
    if (iosBuild.trim() && (isNaN(Number(iosBuild)) || Number(iosBuild) < 1)) {
      errors.iosBuild = 'iOS build number must be a positive integer.';
    }

    // Store URLs
    const urlPattern = /^https?:\/\/.+/i;
    if (googleplayLink.trim() && !urlPattern.test(googleplayLink.trim())) {
      errors.googleplayLink = 'Must be a valid URL starting with http:// or https://';
    }
    if (appstoreLink.trim() && !urlPattern.test(appstoreLink.trim())) {
      errors.appstoreLink = 'Must be a valid URL starting with http:// or https://';
    }

    // Firebase
    if (firebaseConfigMode === 'KEY' && firebasePushKey.trim() && firebasePushKey.trim().length < 20) {
      errors.firebasePushKey = 'Legacy Server Key appears too short. Please verify the key from Firebase Console.';
    }
    if (firebaseConfigMode === 'JSON' && firebaseServiceAccountJson.trim() && jsonError) {
      errors.firebaseJson = jsonError;
    }

    // Policy URLs
    if (androidAdsPolicyUrl.trim() && !urlPattern.test(androidAdsPolicyUrl.trim())) {
      errors.androidAdsPolicyUrl = 'Must be a valid URL starting with http:// or https://';
    }
    if (iosAdsPolicyUrl.trim() && !urlPattern.test(iosAdsPolicyUrl.trim())) {
      errors.iosAdsPolicyUrl = 'Must be a valid URL starting with http:// or https://';
    }
    if (androidVideoUrl.trim() && !urlPattern.test(androidVideoUrl.trim())) {
      errors.androidVideoUrl = 'Must be a valid URL starting with http:// or https://';
    }

    // Notification frequency
    if (ownNotificationFreq.trim() && (isNaN(Number(ownNotificationFreq)) || Number(ownNotificationFreq) < 1)) {
      errors.ownNotificationFreq = 'Must be a positive number (days).';
    }
    if (crossNotificationFreq.trim() && (isNaN(Number(crossNotificationFreq)) || Number(crossNotificationFreq) < 1)) {
      errors.crossNotificationFreq = 'Must be a positive number (days).';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Auto-navigate to the first tab that has errors
      const tabErrorMap: Record<string, string[]> = {
        basic: ['appName', 'androidPackage', 'iosBundleId', 'appVersion', 'androidBuild', 'iosBuild'],
        stores: ['googleplayLink', 'appstoreLink'],
        marketing: ['firebasePushKey', 'firebaseJson', 'ownNotificationFreq', 'crossNotificationFreq'],
        policy: ['androidAdsPolicyUrl', 'iosAdsPolicyUrl', 'androidVideoUrl']
      };
      for (const [tab, fields] of Object.entries(tabErrorMap)) {
        if (fields.some((f) => errors[f])) {
          setActiveTab(tab as any);
          break;
        }
      }
      setSaveError('Please fix the highlighted errors before saving.');
      return;
    }

    setFieldErrors({});
    setSaveError(null);
    setLoading(true);
    try {
      const payload: any = {
        app_name: appName.trim(),
        android_package_name: androidPackage.trim(),
        ios_bundle_id: iosBundleId.trim(),
        package_name: androidPackage.trim() || iosBundleId.trim(),
        group_id: groupId || null,
        platform,
        app_age_rating: ageRating,
        app_version: appVersion,
        android_latest_build_number: androidBuild,
        ios_latest_build_number: iosBuild,
        googleplay_link: googleplayLink,
        appstore_link: appstoreLink,
        store_url_android: googleplayLink,
        store_url_ios: appstoreLink,
        google_play_account: googlePlayAccount,
        apple_store_account: appleStoreAccount,
        ads_account: adsAccount,
        Firebase_push_key: firebasePushKey,
        firebase_server_key: firebasePushKey,
        firebase_service_account_json: firebaseServiceAccountJson,
        firebase_project_id: firebaseProjectId,
        firebase_client_email: firebaseClientEmail,
        is_push_marketing: isPushMarketing,
        is_cross_push_marketing: isCrossPushMarketing,
        is_cross_app_ads_banner_marketing: isCrossAppAdsBanner,
        Own_notification_timePrefrance: ownNotificationTime,
        Cross_app_notification_time_prefrance: crossNotificationTime,
        Own_app_notification_frequancy: ownNotificationFreq,
        Cross_app_notification_frequancy: crossNotificationFreq,
        Android_ads_policy_URL: androidAdsPolicyUrl,
        iOS_ads_policy_URL: iosAdsPolicyUrl,
        android_video_url: androidVideoUrl,
        ios_video_url: iosVideoUrl
      };

      if (editingAppId) {
        // Update Existing App
        const res = await api.put(`/admin/apps/${editingAppId}`, payload);
        if (res.data.success) {
          setShowModal(false);
          resetForm();
          onRefresh();
        }
      } else {
        // Register New App
        const res = await api.post('/admin/apps', payload);
        if (res.data.success) {
          setShowModal(false);
          resetForm();
          onRefresh();
        }
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      setSaveError(serverMessage || 'Unable to save the application. Please review the form and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingAppId(null);
    setAppName('');
    setAndroidPackage('');
    setIosBundleId('');
    setGroupId('');
    setPlatform('ANDROID');
    setAgeRating('3+');
    setAppVersion('1.0.0');
    setAndroidBuild('1');
    setIosBuild('1');
    setGoogleplayLink('');
    setAppstoreLink('');
    setGooglePlayAccount('');
    setAppleStoreAccount('');
    setAdsAccount('');
    setFirebasePushKey('');
    setFirebaseServiceAccountJson('');
    setFirebaseProjectId('');
    setFirebaseClientEmail('');
    setJsonError(null);
    setSaveError(null);
    setFieldErrors({});
    setShowRawJson(false);
    setFirebaseConfigMode('JSON');
    setIsPushMarketing(true);
    setIsCrossPushMarketing(true);
    setIsCrossAppAdsBanner(true);
    setOwnNotificationTime('20:00');
    setCrossNotificationTime('20:00');
    setOwnNotificationFreq('1');
    setCrossNotificationFreq('2');
    setAndroidAdsPolicyUrl('');
    setIosAdsPolicyUrl('');
    setAndroidVideoUrl('');
    setIosVideoUrl('');
  };

  // Helper: render an inline field error
  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginTop: '4px',
          fontSize: '0.72rem',
          color: '#EF4444',
          fontWeight: 500
        }}
      >
        <AlertCircle size={12} style={{ flexShrink: 0 }} />
        <span>{fieldErrors[field]}</span>
      </div>
    ) : null;

  const handleRegenerateKeys = async (appId: string) => {
    if (!window.confirm('Regenerate API keys for this app? Old keys will immediately become invalid.')) return;
    try {
      await api.post(`/admin/apps/${appId}/keys`);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to regenerate keys');
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!window.confirm('Delete this application and all associated data?')) return;
    try {
      await api.delete(`/admin/apps/${appId}`);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete app');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            Application Directory (tbl_app)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Register and edit apps, manage API keys, configure push timing preferences, cross-marketing flags, and store URLs
          </p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ gap: '8px' }}>
          <Plus size={18} />
          <span>Register New Application</span>
        </button>
      </div>

      {/* Apps Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Application</th>
              <th>Group</th>
              <th>Platform</th>
              <th>Version / Build</th>
              <th>Client API Key (app_key)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  <Smartphone size={36} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>No applications registered yet.</div>
                </td>
              </tr>
            ) : (
              apps.map((app) => {
                const groupObj = typeof app.group_id === 'object' ? (app.group_id as Group) : null;
                return (
                  <tr key={app._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(99, 102, 241, 0.3)'
                          }}
                        >
                          <Smartphone size={20} color="#6366F1" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{app.app_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }} className="font-mono">
                            {app.package_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: groupObj ? `${groupObj.color_code}22` : 'var(--bg-pill)',
                          color: groupObj ? groupObj.color_code : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {groupObj ? groupObj.group_name : 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">{app.platform}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        v{app.app_version}
                        {app.android_latest_build_number && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '4px' }}>
                            ({app.android_latest_build_number})
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code
                          className="font-mono"
                          style={{
                            fontSize: '0.75rem',
                            background: 'var(--bg-pill)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            color: '#10B981',
                            fontWeight: 600
                          }}
                        >
                          {(app.app_key || app.api_key) ? `${(app.app_key || app.api_key).substring(0, 16)}...` : 'N/A'}
                        </code>
                        <button
                          onClick={() => handleCopy(app.app_key || app.api_key, app._id)}
                          className="btn btn-secondary btn-sm"
                          title="Copy Full App Key"
                        >
                          {copiedKey === app._id ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(app)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Application Details"
                          style={{
                            color: '#6366F1',
                            borderColor: 'rgba(99, 102, 241, 0.3)',
                            background: 'rgba(99, 102, 241, 0.08)'
                          }}
                        >
                          <Edit3 size={13} />
                        </button>
                        {/* Regenerate Key */}
                        <button
                          onClick={() => handleRegenerateKeys(app._id)}
                          className="btn btn-secondary btn-sm"
                          title="Regenerate API Key"
                        >
                          <RefreshCw size={13} />
                        </button>
                        {/* Delete App */}
                        <button
                          onClick={() => handleDeleteApp(app._id)}
                          className="btn btn-danger btn-sm"
                          title="Delete App"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Comprehensive Add / Edit App Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '0',
              maxWidth: '780px',
              width: '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-modal)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header & Tabs (Fixed at top) */}
            <div style={{ padding: '26px 30px 0 30px', flexShrink: 0 }}>
              {/* Modal Title & Close Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                    {editingAppId ? `Edit Application (${appName || 'App'})` : 'Register New Application (tbl_app)'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {editingAppId
                      ? 'Update configuration, push preferences, store links and developer credentials'
                      : 'Saves directly into MongoDB collection tbl_app'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
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

              {/* Modal Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  borderBottom: '1px solid var(--border-color)',
                  marginTop: '16px',
                  marginBottom: '0px'
                }}
              >
                {[
                  { id: 'basic', label: '1. General Info', icon: Smartphone },
                  { id: 'stores', label: '2. Stores & Accounts', icon: Globe },
                  { id: 'marketing', label: '3. Push & Marketing', icon: Bell },
                  { id: 'policy', label: '4. Policy & Media', icon: ShieldAlert }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#6366F1' : 'var(--text-muted)',
                        borderBottom: isActive ? '2px solid #6366F1' : '2px solid transparent',
                        background: 'transparent',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleSaveApp}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1,
                overflowY: 'auto',
                padding: '20px 30px 26px 30px'
              }}
            >
              {saveError && (
                <div
                  role="alert"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#991B1B',
                    fontSize: '0.82rem',
                    lineHeight: 1.45
                  }}
                >
                  <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{saveError}</span>
                </div>
              )}

              {/* TAB 1: General Info */}
              {activeTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.appName ? '#EF4444' : 'var(--text-muted)' }}>
                        Application Name (app_name) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Love Calculator Pro"
                        className="input-control"
                        style={fieldErrors.appName ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                        value={appName}
                        onChange={(e) => {
                          setAppName(e.target.value);
                          clearFieldError('appName');
                          setSaveError(null);
                        }}
                      />
                      <FieldError field="appName" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Assign to Group (Optional)
                      </label>
                      <select
                        className="input-control"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                      >
                        <option value="">-- No Group (Optional) --</option>
                        {groups.map((g) => (
                          <option key={g._id} value={g._id}>
                            {g.group_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.androidPackage ? '#EF4444' : 'var(--text-muted)' }}>
                        Android Package Name (android_package_name)
                        {(platform === 'ANDROID' || platform === 'BOTH') && <span style={{ color: '#EF4444' }}> *</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="com.example.app"
                        className="input-control font-mono"
                        style={fieldErrors.androidPackage ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                        value={androidPackage}
                        onChange={(e) => {
                          setAndroidPackage(e.target.value);
                          clearFieldError('androidPackage');
                          setSaveError(null);
                        }}
                      />
                      <FieldError field="androidPackage" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.iosBundleId ? '#EF4444' : 'var(--text-muted)' }}>
                        iOS Bundle ID (ios_bundle_id)
                        {(platform === 'IOS' || platform === 'BOTH') && <span style={{ color: '#EF4444' }}> *</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="com.example.app.ios"
                        className="input-control font-mono"
                        style={fieldErrors.iosBundleId ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                        value={iosBundleId}
                        onChange={(e) => {
                          setIosBundleId(e.target.value);
                          clearFieldError('iosBundleId');
                          setSaveError(null);
                        }}
                      />
                      <FieldError field="iosBundleId" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Platform
                      </label>
                      <select
                        className="input-control"
                        value={platform}
                        onChange={(e: any) => {
                          setPlatform(e.target.value);
                          clearFieldError('androidPackage');
                          clearFieldError('iosBundleId');
                        }}
                      >
                        <option value="ANDROID">Android</option>
                        <option value="IOS">iOS</option>
                        <option value="BOTH">Both</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.appVersion ? '#EF4444' : 'var(--text-muted)' }}>
                        Version
                      </label>
                      <input
                        type="text"
                        placeholder="1.0.0"
                        className="input-control font-mono"
                        style={fieldErrors.appVersion ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                        value={appVersion}
                        onChange={(e) => {
                          setAppVersion(e.target.value);
                          clearFieldError('appVersion');
                        }}
                      />
                      <FieldError field="appVersion" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Age Rating
                      </label>
                      <input
                        type="text"
                        placeholder="3+, 12+, 18+"
                        className="input-control"
                        value={ageRating}
                        onChange={(e) => setAgeRating(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.androidBuild ? '#EF4444' : 'var(--text-muted)' }}>
                        Android Build Number
                      </label>
                      <input
                        type="text"
                        className="input-control font-mono"
                        style={fieldErrors.androidBuild ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                        value={androidBuild}
                        onChange={(e) => {
                          setAndroidBuild(e.target.value);
                          clearFieldError('androidBuild');
                        }}
                      />
                      <FieldError field="androidBuild" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.iosBuild ? '#EF4444' : 'var(--text-muted)' }}>
                        iOS Build Number
                      </label>
                      <input
                        type="text"
                        className="input-control font-mono"
                        style={fieldErrors.iosBuild ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                        value={iosBuild}
                        onChange={(e) => {
                          setIosBuild(e.target.value);
                          clearFieldError('iosBuild');
                        }}
                      />
                      <FieldError field="iosBuild" />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Stores & Accounts */}
              {activeTab === 'stores' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.googleplayLink ? '#EF4444' : 'var(--text-muted)' }}>
                      Google Play Store Link (googleplay_link)
                    </label>
                    <input
                      type="url"
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      className="input-control font-mono"
                      style={fieldErrors.googleplayLink ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                      value={googleplayLink}
                      onChange={(e) => {
                        setGoogleplayLink(e.target.value);
                        clearFieldError('googleplayLink');
                      }}
                    />
                    <FieldError field="googleplayLink" />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.appstoreLink ? '#EF4444' : 'var(--text-muted)' }}>
                      Apple App Store Link (appstore_link)
                    </label>
                    <input
                      type="url"
                      placeholder="https://apps.apple.com/app/..."
                      className="input-control font-mono"
                      style={fieldErrors.appstoreLink ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                      value={appstoreLink}
                      onChange={(e) => {
                        setAppstoreLink(e.target.value);
                        clearFieldError('appstoreLink');
                      }}
                    />
                    <FieldError field="appstoreLink" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Play Console Account
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Org Dev A"
                        className="input-control"
                        value={googlePlayAccount}
                        onChange={(e) => setGooglePlayAccount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        App Store Account
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Team iOS"
                        className="input-control"
                        value={appleStoreAccount}
                        onChange={(e) => setAppleStoreAccount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        AdMob Account ID
                      </label>
                      <input
                        type="text"
                        placeholder="pub-xxxxxxxx"
                        className="input-control font-mono"
                        value={adsAccount}
                        onChange={(e) => setAdsAccount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Push & Marketing */}
              {activeTab === 'marketing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Firebase Configuration Box */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Bell size={16} color="#6366F1" />
                          <span>Firebase Cloud Messaging (FCM) Credentials</span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Configure Service Account JSON (recommended by Google) or legacy Server Key
                        </p>
                      </div>

                      {/* Mode Switcher */}
                      <div
                        style={{
                          display: 'flex',
                          background: 'var(--bg-pill)',
                          padding: '3px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setFirebaseConfigMode('JSON')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            background: firebaseConfigMode === 'JSON' ? 'var(--primary)' : 'transparent',
                            color: firebaseConfigMode === 'JSON' ? '#FFFFFF' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          📄 Service Account JSON (v1)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFirebaseConfigMode('KEY')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            background: firebaseConfigMode === 'KEY' ? 'var(--primary)' : 'transparent',
                            color: firebaseConfigMode === 'KEY' ? '#FFFFFF' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          🔑 Legacy Server Key
                        </button>
                      </div>
                    </div>

                    {/* Mode 1: Service Account JSON */}
                    {firebaseConfigMode === 'JSON' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                        {/* File Upload Trigger */}
                        <div
                          style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px',
                            textAlign: 'center',
                            background: 'var(--bg-pill)',
                            transition: 'border-color 0.2s ease',
                            position: 'relative'
                          }}
                        >
                          <input
                            type="file"
                            accept=".json,application/json"
                            onChange={handleJsonFileUpload}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              opacity: 0,
                              cursor: 'pointer',
                              width: '100%',
                              height: '100%'
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'rgba(99, 102, 241, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Upload size={18} color="#6366F1" />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                              Click to select or drop <code className="font-mono" style={{ color: '#6366F1' }}>serviceAccountKey.json</code>
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              From Firebase Console &gt; Project Settings &gt; Service Accounts &gt; Generate new private key
                            </span>
                          </div>
                        </div>

                        {/* Verified Card if project_id exists */}
                        {firebaseProjectId && (
                          <div
                            style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircle2 size={18} color="#10B981" />
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                                  Verified Firebase Project: <span className="font-mono">{firebaseProjectId}</span>
                                </div>
                                {firebaseClientEmail && (
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Client Email: {firebaseClientEmail}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFirebaseServiceAccountJson('');
                                setFirebaseProjectId('');
                                setFirebaseClientEmail('');
                                setJsonError(null);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {/* Parse Error Box */}
                        {jsonError && (
                          <div
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#EF4444',
                              fontSize: '0.74rem'
                            }}
                          >
                            <AlertCircle size={15} />
                            <span>{jsonError}</span>
                          </div>
                        )}

                        {/* Raw JSON View / Paste Toggle */}
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowRawJson(!showRawJson)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.74rem',
                              color: '#6366F1',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              fontWeight: 600
                            }}
                          >
                            {showRawJson ? <EyeOff size={13} /> : <Eye size={13} />}
                            <span>{showRawJson ? 'Hide Raw JSON' : 'Or Paste / View Raw JSON'}</span>
                          </button>

                          {showRawJson && (
                            <div style={{ marginTop: '8px' }}>
                              <textarea
                                rows={4}
                                placeholder='{"type": "service_account", "project_id": "...", "private_key": "..."}'
                                className="input-control font-mono"
                                style={{ fontSize: '0.72rem', lineHeight: '1.4' }}
                                value={firebaseServiceAccountJson}
                                onChange={(e) => handleJsonTextChange(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mode 2: Legacy Server Key */}
                    {firebaseConfigMode === 'KEY' && (
                      <div style={{ marginTop: '4px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.firebasePushKey ? '#EF4444' : 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                          Firebase Legacy Server Key (Firebase_push_key)
                        </label>
                        <input
                          type="text"
                          placeholder="AAAA..."
                          className="input-control font-mono"
                          style={fieldErrors.firebasePushKey ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                          value={firebasePushKey}
                          onChange={(e) => {
                            setFirebasePushKey(e.target.value);
                            clearFieldError('firebasePushKey');
                          }}
                        />
                        <FieldError field="firebasePushKey" />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                          Located in Firebase Console &gt; Project Settings &gt; Cloud Messaging &gt; Cloud Messaging API (Legacy)
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Self Notification Preference Time
                      </label>
                      <input
                        type="time"
                        className="input-control font-mono"
                        value={ownNotificationTime}
                        onChange={(e) => setOwnNotificationTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Cross App Notification Preference Time
                      </label>
                      <input
                        type="time"
                        className="input-control font-mono"
                        value={crossNotificationTime}
                        onChange={(e) => setCrossNotificationTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.ownNotificationFreq ? '#EF4444' : 'var(--text-muted)' }}>
                        Own Notification Frequency (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input-control"
                        style={fieldErrors.ownNotificationFreq ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                        value={ownNotificationFreq}
                        onChange={(e) => {
                          setOwnNotificationFreq(e.target.value);
                          clearFieldError('ownNotificationFreq');
                        }}
                      />
                      <FieldError field="ownNotificationFreq" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.crossNotificationFreq ? '#EF4444' : 'var(--text-muted)' }}>
                        Cross Notification Frequency (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input-control"
                        style={fieldErrors.crossNotificationFreq ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                        value={crossNotificationFreq}
                        onChange={(e) => {
                          setCrossNotificationFreq(e.target.value);
                          clearFieldError('crossNotificationFreq');
                        }}
                      />
                      <FieldError field="crossNotificationFreq" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={isPushMarketing}
                        onChange={(e) => setIsPushMarketing(e.target.checked)}
                      />
                      <span>Enable Self Push Marketing</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={isCrossPushMarketing}
                        onChange={(e) => setIsCrossPushMarketing(e.target.checked)}
                      />
                      <span>Enable Cross Push Marketing</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 4: Policy & Media */}
              {activeTab === 'policy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.androidAdsPolicyUrl ? '#EF4444' : 'var(--text-muted)' }}>
                      Android Ads Policy URL (Android_ads_policy_URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/privacy-policy"
                      className="input-control font-mono"
                      style={fieldErrors.androidAdsPolicyUrl ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                      value={androidAdsPolicyUrl}
                      onChange={(e) => {
                        setAndroidAdsPolicyUrl(e.target.value);
                        clearFieldError('androidAdsPolicyUrl');
                      }}
                    />
                    <FieldError field="androidAdsPolicyUrl" />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.iosAdsPolicyUrl ? '#EF4444' : 'var(--text-muted)' }}>
                      iOS Ads Policy URL (iOS_ads_policy_URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/privacy-policy-ios"
                      className="input-control font-mono"
                      style={fieldErrors.iosAdsPolicyUrl ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                      value={iosAdsPolicyUrl}
                      onChange={(e) => {
                        setIosAdsPolicyUrl(e.target.value);
                        clearFieldError('iosAdsPolicyUrl');
                      }}
                    />
                    <FieldError field="iosAdsPolicyUrl" />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.androidVideoUrl ? '#EF4444' : 'var(--text-muted)' }}>
                      Promo Video URL (android_video_url)
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      className="input-control font-mono"
                      style={fieldErrors.androidVideoUrl ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                      value={androidVideoUrl}
                      onChange={(e) => {
                        setAndroidVideoUrl(e.target.value);
                        clearFieldError('androidVideoUrl');
                      }}
                    />
                    <FieldError field="androidVideoUrl" />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {editingAppId ? (
                    <span>
                      Editing app ID: <code className="font-mono" style={{ color: '#6366F1' }}>{editingAppId}</code>
                    </span>
                  ) : (
                    <span>
                      Auto-generates unique <span style={{ color: '#10B981' }}>app_key</span> on save
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontWeight: 800 }}>
                    {loading ? 'Saving...' : editingAppId ? 'Save Changes' : 'Register Application'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
