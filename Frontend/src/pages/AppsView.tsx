import React, { useState, useEffect } from 'react';
import type { App, Group, Account } from '../types';
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
  EyeOff,
  Users,
  ChevronDown,
  Search,
  Image as ImageIcon
} from 'lucide-react';
import { ALL_WORLD_COUNTRIES as AVAILABLE_COUNTRIES } from '../data/countries';

interface AppsViewProps {
  apps: App[];
  groups: Group[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AppsView: React.FC<AppsViewProps> = ({ apps, groups, onRefresh, isLoading = false }) => {
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

  // Developer Accounts State (tbl_accountinfo)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'GOOGLE_PLAY' | 'APPLE_APP_STORE' | 'ADMOB'>('GOOGLE_PLAY');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccId, setNewAccId] = useState('');
  const [accLoading, setAccLoading] = useState(false);
  const [accError, setAccError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/admin/accounts');
      if (res.data.success) {
        setAccounts(res.data.accounts || []);
      }
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAccName.trim()) {
      setAccError('Account name is required');
      return;
    }
    setAccLoading(true);
    setAccError(null);
    try {
      const res = await api.post('/admin/accounts', {
        account_name: newAccName.trim(),
        store_type: newAccType,
        developer_email: newAccEmail.trim(),
        account_id: newAccId.trim()
      });
      if (res.data.success) {
        await fetchAccounts();
        setNewAccName('');
        setNewAccEmail('');
        setNewAccId('');
      }
    } catch (err: any) {
      setAccError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setAccLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this developer account?')) return;
    try {
      await api.delete(`/admin/accounts/${id}`);
      await fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete account');
    }
  };

  // Form State (Exact mapping to tbl_app in Excel sheet)
  const [appName, setAppName] = useState('');
  const [logoPhoto, setLogoPhoto] = useState('');
  const [androidPackage, setAndroidPackage] = useState('');
  const [iosBundleId, setIosBundleId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [platform, setPlatform] = useState<'ANDROID' | 'IOS' | 'BOTH'>('ANDROID');
  const [ageRating, setAgeRating] = useState('3+');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [androidBuild, setAndroidBuild] = useState('1');
  const [iosBuild, setIosBuild] = useState('1');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['ALL']);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleCountry = (code: string) => {
    if (code === 'ALL') {
      setSelectedCountries(['ALL']);
      return;
    }
    let updated = selectedCountries.filter((c) => c !== 'ALL');
    if (updated.includes(code)) {
      updated = updated.filter((c) => c !== code);
      if (updated.length === 0) updated = ['ALL'];
    } else {
      updated.push(code);
    }
    setSelectedCountries(updated);
  };

  // Stores & Accounts
  const [googleplayLink, setGoogleplayLink] = useState('');
  const [appstoreLink, setAppstoreLink] = useState('');
  const [isNotAvailablePlaystore, setIsNotAvailablePlaystore] = useState(false);
  const [newGooglePlayLink, setNewGooglePlayLink] = useState('');
  const [isNotAvailableAppstore, setIsNotAvailableAppstore] = useState(false);
  const [newAppleAppLink, setNewAppleAppLink] = useState('');
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
  const [isAdsBannerMarketing, setIsAdsBannerMarketing] = useState(true);
  const [verticalBanners, setVerticalBanners] = useState<string[]>([]);
  const [horizontalBanners, setHorizontalBanners] = useState<string[]>([]);
  const [newVerticalUrl, setNewVerticalUrl] = useState('');
  const [newHorizontalUrl, setNewHorizontalUrl] = useState('');
  const [ownNotificationTime, setOwnNotificationTime] = useState('20:00');
  const [crossNotificationTime, setCrossNotificationTime] = useState('20:00');
  const [ownNotificationFreq, setOwnNotificationFreq] = useState('1');
  const [crossNotificationFreq, setCrossNotificationFreq] = useState('2');
  const [ownAppNotificationMessages, setOwnAppNotificationMessages] = useState<string[]>([]);
  const [crossNotificationMessages, setCrossNotificationMessages] = useState<string[]>([]);
  const [newOwnMsg, setNewOwnMsg] = useState('');
  const [newCrossMsg, setNewCrossMsg] = useState('');

  const handleVerticalBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('Banner image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setVerticalBanners((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleHorizontalBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('Banner image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setHorizontalBanners((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

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
    fetchAccounts();
    resetForm();
    setEditingAppId(null);
    setActiveTab('basic');
    setSaveError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (app: App) => {
    fetchAccounts();
    setEditingAppId(app._id);
    setAppName(app.app_name || '');
    setLogoPhoto(app.logo_photo || app.app_icon || '');
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
    setIsNotAvailablePlaystore(!!app.is_not_available_playstore);
    setNewGooglePlayLink(app.new_google_play_link || '');
    setIsNotAvailableAppstore(!!app.is_not_available_appstore);
    setNewAppleAppLink(app.new_apple_app_link || '');
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
    setIsAdsBannerMarketing(app.is_adsbanner_marketing !== undefined ? app.is_adsbanner_marketing : true);
    setVerticalBanners(Array.isArray(app.vertical_banner_photo) ? app.vertical_banner_photo : []);
    setHorizontalBanners(Array.isArray(app.horizontal_banner_photo) ? app.horizontal_banner_photo : []);
    setNewVerticalUrl('');
    setNewHorizontalUrl('');
    setOwnNotificationTime(app.Own_notification_timePrefrance || '20:00');
    setCrossNotificationTime(app.Cross_app_notification_time_prefrance || '20:00');
    setOwnNotificationFreq(app.Own_app_notification_frequancy || '1');
    setCrossNotificationFreq(app.Cross_app_notification_frequancy || '2');
    setOwnAppNotificationMessages(Array.isArray(app.own_app_notification_message) ? app.own_app_notification_message : []);
    setCrossNotificationMessages(Array.isArray(app.cross_notification_message_text) ? app.cross_notification_message_text : []);
    setNewOwnMsg('');
    setNewCrossMsg('');

    // Media & Policy
    setAndroidAdsPolicyUrl(app.Android_ads_policy_URL || '');
    setIosAdsPolicyUrl(app.iOS_ads_policy_URL || '');
    setAndroidVideoUrl(app.android_video_url || '');
    setIosVideoUrl(app.ios_video_url || '');

    // Target Countries (country_id)
    const loadedCountries = Array.isArray(app.country_id)
      ? app.country_id
      : app.country_id
      ? [app.country_id]
      : ['ALL'];
    setSelectedCountries(loadedCountries.length > 0 ? loadedCountries : ['ALL']);

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

    // Package / Bundle – optional (check format only if value is provided)
    const androidPkgPattern = /^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*){1,}$/;
    const iosBundlePattern = /^[a-zA-Z][a-zA-Z0-9\-]*(?:\.[a-zA-Z0-9\-]+){1,}$/;

    if (androidPackage.trim() && !androidPkgPattern.test(androidPackage.trim())) {
      errors.androidPackage = 'Invalid format. Expected: com.example.app (at least two dot-separated segments).';
    }

    if (iosBundleId.trim() && !iosBundlePattern.test(iosBundleId.trim())) {
      errors.iosBundleId = 'Invalid format. Expected: com.example.app (at least two dot-separated segments).';
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
    if (iosVideoUrl.trim() && !urlPattern.test(iosVideoUrl.trim())) {
      errors.iosVideoUrl = 'Must be a valid URL starting with http:// or https://';
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
        policy: ['androidAdsPolicyUrl', 'iosAdsPolicyUrl', 'androidVideoUrl', 'iosVideoUrl']
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
        logo_photo: logoPhoto,
        app_icon: logoPhoto,
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
        is_not_available_playstore: isNotAvailablePlaystore,
        new_google_play_link: newGooglePlayLink,
        is_not_available_appstore: isNotAvailableAppstore,
        new_apple_app_link: newAppleAppLink,
        google_play_account: googlePlayAccount,
        apple_store_account: appleStoreAccount,
        apple_app_store_account: appleStoreAccount,
        ads_account: adsAccount,
        country_id: selectedCountries,
        Firebase_push_key: firebasePushKey,
        firebase_server_key: firebasePushKey,
        firebase_service_account_json: firebaseServiceAccountJson,
        firebase_project_id: firebaseProjectId,
        firebase_client_email: firebaseClientEmail,
        is_push_marketing: isPushMarketing,
        is_cross_push_marketing: isCrossPushMarketing,
        is_cross_app_ads_banner_marketing: isCrossAppAdsBanner,
        is_adsbanner_marketing: isAdsBannerMarketing,
        vertical_banner_photo: verticalBanners,
        horizontal_banner_photo: horizontalBanners,
        Own_notification_timePrefrance: ownNotificationTime,
        Cross_app_notification_time_prefrance: crossNotificationTime,
        Own_app_notification_frequancy: ownNotificationFreq,
        Cross_app_notification_frequancy: crossNotificationFreq,
        own_app_notification_message: ownAppNotificationMessages,
        cross_notification_message_text: crossNotificationMessages,
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
    setLogoPhoto('');
    setAndroidPackage('');
    setIosBundleId('');
    setGroupId('');
    setPlatform('ANDROID');
    setAgeRating('3+');
    setAppVersion('1.0.0');
    setAndroidBuild('1');
    setIosBuild('1');
    setSelectedCountries(['ALL']);
    setGoogleplayLink('');
    setAppstoreLink('');
    setIsNotAvailablePlaystore(false);
    setNewGooglePlayLink('');
    setIsNotAvailableAppstore(false);
    setNewAppleAppLink('');
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
    setIsAdsBannerMarketing(true);
    setVerticalBanners([]);
    setHorizontalBanners([]);
    setNewVerticalUrl('');
    setNewHorizontalUrl('');
    setOwnNotificationTime('20:00');
    setCrossNotificationTime('20:00');
    setOwnNotificationFreq('1');
    setCrossNotificationFreq('2');
    setOwnAppNotificationMessages([]);
    setCrossNotificationMessages([]);
    setNewOwnMsg('');
    setNewCrossMsg('');
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
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                    <div className="spinner" style={{ width: '34px', height: '34px' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Loading applications...
                    </span>
                  </div>
                </td>
              </tr>
            ) : apps.length === 0 ? (
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
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}
                        >
                          {app.logo_photo || app.app_icon ? (
                            <img
                              src={app.logo_photo || app.app_icon}
                              alt={app.app_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Smartphone size={20} color="#6366F1" />
                          )}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: isCountryDropdownOpen ? '250px' : '10px', transition: 'padding-bottom 0.2s ease' }}>
                  {/* App Icon / Logo Photo (logo_photo) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px'
                    }}
                  >
                    {/* Live Preview Avatar */}
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: 'rgba(99, 102, 241, 0.12)',
                        border: '1.5px solid rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      {logoPhoto ? (
                        <img
                          src={logoPhoto}
                          alt="App Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon size={26} color="#6366F1" />
                      )}
                    </div>

                    {/* Uploader & URL inputs */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                          App Icon / Logo (logo_photo)
                        </label>
                        {logoPhoto && (
                          <button
                            type="button"
                            onClick={() => setLogoPhoto('')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#EF4444',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            height: '32px',
                            margin: 0
                          }}
                        >
                          <Upload size={13} />
                          <span>Upload Image</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleLogoFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>

                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>or</span>

                        <input
                          type="text"
                          placeholder="Paste image URL (https://...)"
                          className="input-control font-mono"
                          style={{ fontSize: '0.75rem', height: '32px', flex: 1 }}
                          value={logoPhoto}
                          onChange={(e) => setLogoPhoto(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
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

                  {/* Package Names & Bundle IDs (Adaptive based on Platform) */}
                  <div style={{ display: 'grid', gridTemplateColumns: platform === 'BOTH' ? '1fr 1fr' : '1fr', gap: '12px' }}>
                    {(platform === 'ANDROID' || platform === 'BOTH') && (
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.androidPackage ? '#EF4444' : 'var(--text-muted)' }}>
                          Android Package Name (android_package_name)
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
                    )}

                    {(platform === 'IOS' || platform === 'BOTH') && (
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.iosBundleId ? '#EF4444' : 'var(--text-muted)' }}>
                          iOS Bundle ID (ios_bundle_id)
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
                    )}
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
                        <option value="BOTH">Both (Android & iOS)</option>
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

                  {/* Build Numbers (Adaptive based on Platform) */}
                  <div style={{ display: 'grid', gridTemplateColumns: platform === 'BOTH' ? '1fr 1fr' : '1fr', gap: '12px' }}>
                    {(platform === 'ANDROID' || platform === 'BOTH') && (
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
                    )}

                    {(platform === 'IOS' || platform === 'BOTH') && (
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
                    )}
                  </div>

                  {/* Target Countries Multi-Select Dropdown (country_id) */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Target Countries (country_id)
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedCountries(['ALL'])}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: selectedCountries.includes('ALL') ? '#6366F1' : 'var(--text-dim)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🌍 Reset to Global (All Countries)
                      </button>
                    </div>

                    {/* Trigger Box */}
                    <div
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="input-control"
                      style={{
                        minHeight: '44px',
                        height: 'auto',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                        border: isCountryDropdownOpen ? '1px solid var(--primary)' : undefined
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flex: 1 }}>
                        {selectedCountries.includes('ALL') ? (
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#6366F1',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            🌍 Global (All Countries Worldwide)
                          </span>
                        ) : (
                          selectedCountries.map((cCode) => {
                            const cObj = AVAILABLE_COUNTRIES.find((c) => c.code === cCode);
                            return (
                              <span
                                key={cCode}
                                className="badge"
                                style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  fontSize: '0.75rem',
                                  padding: '2px 7px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>{cObj?.flag}</span>
                                <span>{cObj?.name || cCode}</span>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCountry(cCode);
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    marginLeft: '2px',
                                    lineHeight: 1
                                  }}
                                >
                                  ×
                                </span>
                              </span>
                            );
                          })
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginLeft: '10px' }}>
                        <ChevronDown
                          size={16}
                          style={{
                            transform: isCountryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      </div>
                    </div>

                    {/* Dropdown Menu Popup */}
                    {isCountryDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.2)',
                          zIndex: 1050,
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        {/* Search Bar */}
                        <div style={{ position: 'relative' }}>
                          <Search
                            size={14}
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-muted)'
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Search country by name or code..."
                            className="input-control"
                            style={{ paddingLeft: '32px', fontSize: '0.78rem', height: '34px' }}
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>

                        {/* List */}
                        <div style={{ maxHeight: '170px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {AVAILABLE_COUNTRIES.filter(
                            (c) =>
                              c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                              c.code.toLowerCase().includes(countrySearch.toLowerCase())
                          ).map((c) => {
                            const isSelected = selectedCountries.includes(c.code);
                            return (
                              <div
                                key={c.code}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCountry(c.code);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  transition: 'background 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                                  <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                                    {c.name}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>({c.code})</span>
                                </div>
                                {isSelected && <Check size={14} color="#6366F1" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom action */}
                        <div
                          style={{
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {selectedCountries.includes('ALL')
                              ? '🌍 Global Worldwide selected'
                              : `${selectedCountries.length} countries selected`}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCountryDropdownOpen(false);
                            }}
                            className="btn btn-primary"
                            style={{
                              padding: '5px 18px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              height: 'auto',
                              borderRadius: '7px'
                            }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Stores & Accounts (Adaptive according to Platform) */}
              {activeTab === 'stores' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Top Helper */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-pill)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)' }}>
                      <Users size={16} color="#6366F1" />
                      <span>
                        Platform Mode: <strong>{platform === 'BOTH' ? 'Android & iOS' : platform}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAccountModal(true)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto' }}
                    >
                      + Manage Accounts
                    </button>
                  </div>

                  {/* ANDROID PLAY CONSOLE (Visible only for ANDROID or BOTH) */}
                  {(platform === 'ANDROID' || platform === 'BOTH') && (
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>🤖</span>
                          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#10B981' }}>
                            Android Play Console Account & Links
                          </span>
                        </div>
                        <span className="badge badge-outline" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10B981', fontSize: '0.7rem' }}>
                          Google Play
                        </span>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.googleplayLink ? '#EF4444' : 'var(--text-muted)' }}>
                          Google Play Store Link (googleplay_link)
                        </label>
                        <input
                          type="url"
                          placeholder="https://play.google.com/store/apps/details?id=com.example.app"
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

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Select Android Developer Account
                          </label>
                          <select
                            className="input-control"
                            value={googlePlayAccount}
                            onChange={(e) => setGooglePlayAccount(e.target.value)}
                          >
                            <option value="">-- Select Saved Account --</option>
                            {accounts
                              .filter(a => a.store_type === 'GOOGLE_PLAY' || a.store_type === 'ANDROID')
                              .map(acc => (
                                <option key={acc._id} value={acc.account_name}>
                                  {acc.account_name} {acc.developer_email ? `(${acc.developer_email})` : ''}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Or Type Custom Account Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. NextGen Android"
                            className="input-control"
                            value={googlePlayAccount}
                            onChange={(e) => setGooglePlayAccount(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Availability & New Play Store Link */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={isNotAvailablePlaystore}
                            onChange={(e) => setIsNotAvailablePlaystore(e.target.checked)}
                          />
                          <span style={{ color: isNotAvailablePlaystore ? '#EF4444' : 'var(--text-main)' }}>
                            App is not available on Play Store (is_not_available_playstore)
                          </span>
                        </label>

                        {isNotAvailablePlaystore && (
                          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#EF4444' }}>
                              New Google Play Link (new_google_play_link)
                            </label>
                            <input
                              type="url"
                              placeholder="https://play.google.com/store/apps/details?id=com.newpackage.app"
                              className="input-control font-mono"
                              style={{ marginTop: '4px' }}
                              value={newGooglePlayLink}
                              onChange={(e) => setNewGooglePlayLink(e.target.value)}
                            />
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                              Redirects old users to the new Play Store listing if the original app was suspended or migrated
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* IOS APPLE APP STORE (Visible only for IOS or BOTH) */}
                  {(platform === 'IOS' || platform === 'BOTH') && (
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>🍏</span>
                          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#3B82F6' }}>
                            iOS Apple Developer Account & Links
                          </span>
                        </div>
                        <span className="badge badge-outline" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', color: '#3B82F6', fontSize: '0.7rem' }}>
                          Apple App Store
                        </span>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.appstoreLink ? '#EF4444' : 'var(--text-muted)' }}>
                          Apple App Store Link (appstore_link)
                        </label>
                        <input
                          type="url"
                          placeholder="https://apps.apple.com/app/id123456789"
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

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Select iOS Developer Account
                          </label>
                          <select
                            className="input-control"
                            value={appleStoreAccount}
                            onChange={(e) => setAppleStoreAccount(e.target.value)}
                          >
                            <option value="">-- Select Saved Account --</option>
                            {accounts
                              .filter(a => a.store_type === 'APPLE_APP_STORE' || a.store_type === 'IOS')
                              .map(acc => (
                                <option key={acc._id} value={acc.account_name}>
                                  {acc.account_name} {acc.developer_email ? `(${acc.developer_email})` : ''}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Or Type Custom Team / Account Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. NextGen iOS"
                            className="input-control"
                            value={appleStoreAccount}
                            onChange={(e) => setAppleStoreAccount(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Availability & New Apple App Store Link */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={isNotAvailableAppstore}
                            onChange={(e) => setIsNotAvailableAppstore(e.target.checked)}
                          />
                          <span style={{ color: isNotAvailableAppstore ? '#EF4444' : 'var(--text-main)' }}>
                            App is not available on App Store (is_not_available_appstore)
                          </span>
                        </label>

                        {isNotAvailableAppstore && (
                          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#EF4444' }}>
                              New Apple App Store Link (new_apple_app_link)
                            </label>
                            <input
                              type="url"
                              placeholder="https://apps.apple.com/app/id987654321"
                              className="input-control font-mono"
                              style={{ marginTop: '4px' }}
                              value={newAppleAppLink}
                              onChange={(e) => setNewAppleAppLink(e.target.value)}
                            />
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                              Redirects iOS users to the new App Store listing
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ADMOB ACCOUNT */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem' }}>📊</span>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F59E0B' }}>
                          AdMob & Ads Account ID (ads_account)
                        </span>
                      </div>
                      <span className="badge badge-outline" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B', fontSize: '0.7rem' }}>
                        AdMob Publisher
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Select AdMob Account
                        </label>
                        <select
                          className="input-control"
                          value={adsAccount}
                          onChange={(e) => setAdsAccount(e.target.value)}
                        >
                          <option value="">-- Select Saved AdMob Account --</option>
                          {accounts
                            .filter(a => a.store_type === 'ADMOB')
                            .map(acc => (
                              <option key={acc._id} value={acc.account_id || acc.account_name}>
                                {acc.account_name} ({acc.account_id || acc.developer_email || 'AdMob'})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Or Custom AdMob Pub ID
                        </label>
                        <input
                          type="text"
                          placeholder="pub-xxxxxxxxxxxxxxxx"
                          className="input-control font-mono"
                          value={adsAccount}
                          onChange={(e) => setAdsAccount(e.target.value)}
                        />
                      </div>
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

                  {/* OWN APP NOTIFICATION MESSAGES (own_app_notification_message) */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                          Own App Notification Messages (own_app_notification_message)
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          Recurring push notification messages sent to users of this app
                        </div>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                        {ownAppNotificationMessages.length} messages
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Type a notification message and press Add or Enter..."
                        className="input-control"
                        style={{ fontSize: '0.78rem', height: '34px', flex: 1 }}
                        value={newOwnMsg}
                        onChange={(e) => setNewOwnMsg(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newOwnMsg.trim()) {
                              setOwnAppNotificationMessages((prev) => [...prev, newOwnMsg.trim()]);
                              setNewOwnMsg('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newOwnMsg.trim()) {
                            setOwnAppNotificationMessages((prev) => [...prev, newOwnMsg.trim()]);
                            setNewOwnMsg('');
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 14px', fontSize: '0.76rem', height: '34px' }}
                      >
                        + Add Message
                      </button>
                    </div>

                    {ownAppNotificationMessages.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        {ownAppNotificationMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'var(--bg-pill)',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.78rem'
                            }}
                          >
                            <span style={{ color: 'var(--text-heading)' }}>💬 {msg}</span>
                            <button
                              type="button"
                              onClick={() => setOwnAppNotificationMessages((prev) => prev.filter((_, i) => i !== idx))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CROSS NOTIFICATION MESSAGES (cross_notification_message_text) */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                          Cross-App Notification Messages (cross_notification_message_text)
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          Promotional messages displayed across your other apps to promote this app
                        </div>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                        {crossNotificationMessages.length} messages
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Type a cross-promotion message and press Add or Enter..."
                        className="input-control"
                        style={{ fontSize: '0.78rem', height: '34px', flex: 1 }}
                        value={newCrossMsg}
                        onChange={(e) => setNewCrossMsg(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCrossMsg.trim()) {
                              setCrossNotificationMessages((prev) => [...prev, newCrossMsg.trim()]);
                              setNewCrossMsg('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCrossMsg.trim()) {
                            setCrossNotificationMessages((prev) => [...prev, newCrossMsg.trim()]);
                            setNewCrossMsg('');
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 14px', fontSize: '0.76rem', height: '34px' }}
                      >
                        + Add Message
                      </button>
                    </div>

                    {crossNotificationMessages.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        {crossNotificationMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'var(--bg-pill)',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.78rem'
                            }}
                          >
                            <span style={{ color: 'var(--text-heading)' }}>📢 {msg}</span>
                            <button
                              type="button"
                              onClick={() => setCrossNotificationMessages((prev) => prev.filter((_, i) => i !== idx))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                      <input
                        type="checkbox"
                        checked={isPushMarketing}
                        onChange={(e) => setIsPushMarketing(e.target.checked)}
                      />
                      <span>Enable Self Push Marketing</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                      <input
                        type="checkbox"
                        checked={isCrossPushMarketing}
                        onChange={(e) => setIsCrossPushMarketing(e.target.checked)}
                      />
                      <span>Enable Cross Push Marketing</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                      <input
                        type="checkbox"
                        checked={isAdsBannerMarketing}
                        onChange={(e) => setIsAdsBannerMarketing(e.target.checked)}
                      />
                      <span>Enable Ads Banner Marketing</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                      <input
                        type="checkbox"
                        checked={isCrossAppAdsBanner}
                        onChange={(e) => setIsCrossAppAdsBanner(e.target.checked)}
                      />
                      <span>Enable Cross App Ads Banner</span>
                    </label>
                  </div>

                  {/* Banner Photos Divider */}
                  <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ImageIcon size={16} color="#6366F1" />
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                        Marketing & Ad Banner Posters (tbl_app)
                      </span>
                    </div>

                    {/* VERTICAL BANNER PHOTOS (vertical_banner_photo) */}
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                            Vertical Banner Photos (vertical_banner_photo)
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Used for Interstitial & Full-screen portrait promotional ads (Aspect ratio ~9:16 or 3:4)
                          </div>
                        </div>
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          {verticalBanners.length} banners
                        </span>
                      </div>

                      {/* Add bar */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label
                          className="btn btn-secondary"
                          style={{
                            padding: '5px 12px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            height: '32px',
                            margin: 0,
                            flexShrink: 0
                          }}
                        >
                          <Upload size={13} />
                          <span>Upload Images</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleVerticalBannerUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <input
                          type="text"
                          placeholder="Or paste Vertical Image URL..."
                          className="input-control font-mono"
                          style={{ fontSize: '0.75rem', height: '32px', flex: 1 }}
                          value={newVerticalUrl}
                          onChange={(e) => setNewVerticalUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newVerticalUrl.trim()) {
                                setVerticalBanners((prev) => [...prev, newVerticalUrl.trim()]);
                                setNewVerticalUrl('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newVerticalUrl.trim()) {
                              setVerticalBanners((prev) => [...prev, newVerticalUrl.trim()]);
                              setNewVerticalUrl('');
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px', fontSize: '0.75rem', height: '32px' }}
                        >
                          Add URL
                        </button>
                      </div>

                      {/* Thumbnails Grid */}
                      {verticalBanners.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '10px', marginTop: '6px' }}>
                          {verticalBanners.map((url, idx) => (
                            <div
                              key={idx}
                              style={{
                                position: 'relative',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                aspectRatio: '9/16',
                                background: '#111827',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            >
                              <img
                                src={url}
                                alt={`Vertical ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.opacity = '0.3';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setVerticalBanners((prev) => prev.filter((_, i) => i !== idx))}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* HORIZONTAL BANNER PHOTOS (horizontal_banner_photo) */}
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                            Horizontal Banner Photos (horizontal_banner_photo)
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Used for Landscape banner ads, Native promos, and header sliders (Aspect ratio ~16:9)
                          </div>
                        </div>
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          {horizontalBanners.length} banners
                        </span>
                      </div>

                      {/* Add bar */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label
                          className="btn btn-secondary"
                          style={{
                            padding: '5px 12px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            height: '32px',
                            margin: 0,
                            flexShrink: 0
                          }}
                        >
                          <Upload size={13} />
                          <span>Upload Images</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleHorizontalBannerUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <input
                          type="text"
                          placeholder="Or paste Horizontal Image URL..."
                          className="input-control font-mono"
                          style={{ fontSize: '0.75rem', height: '32px', flex: 1 }}
                          value={newHorizontalUrl}
                          onChange={(e) => setNewHorizontalUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newHorizontalUrl.trim()) {
                                setHorizontalBanners((prev) => [...prev, newHorizontalUrl.trim()]);
                                setNewHorizontalUrl('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newHorizontalUrl.trim()) {
                              setHorizontalBanners((prev) => [...prev, newHorizontalUrl.trim()]);
                              setNewHorizontalUrl('');
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px', fontSize: '0.75rem', height: '32px' }}
                        >
                          Add URL
                        </button>
                      </div>

                      {/* Thumbnails Grid */}
                      {horizontalBanners.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginTop: '6px' }}>
                          {horizontalBanners.map((url, idx) => (
                            <div
                              key={idx}
                              style={{
                                position: 'relative',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                aspectRatio: '16/9',
                                background: '#111827',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            >
                              <img
                                src={url}
                                alt={`Horizontal ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.opacity = '0.3';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setHorizontalBanners((prev) => prev.filter((_, i) => i !== idx))}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Policy & Media */}
              {activeTab === 'policy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* ADS POLICY SECTION */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldAlert size={16} color="#6366F1" />
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                        Advertising Policy & Privacy URLs
                      </span>
                    </div>

                    {(platform === 'ANDROID' || platform === 'BOTH') && (
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.androidAdsPolicyUrl ? '#EF4444' : 'var(--text-muted)' }}>
                          Android Ads Policy URL (Android_ads_policy_URL)
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/privacy-policy-android"
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
                    )}

                    {(platform === 'IOS' || platform === 'BOTH') && (
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
                    )}
                  </div>

                  {/* PROMO VIDEOS SECTION */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={16} color="#10B981" />
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                        Promotional & Gameplay Video URLs
                      </span>
                    </div>

                    {(platform === 'ANDROID' || platform === 'BOTH') && (
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.androidVideoUrl ? '#EF4444' : 'var(--text-muted)' }}>
                          Android Promo Video URL (android_video_url)
                        </label>
                        <input
                          type="url"
                          placeholder="https://youtube.com/watch?v=android-trailer"
                          className="input-control font-mono"
                          style={fieldErrors.androidVideoUrl ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                          value={androidVideoUrl}
                          onChange={(e) => {
                            setAndroidVideoUrl(e.target.value);
                            clearFieldError('androidVideoUrl');
                          }}
                        />
                        <FieldError field="androidVideoUrl" />
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Used on Play Store promotions or in-app rewarded video previews
                        </div>
                      </div>
                    )}

                    {(platform === 'IOS' || platform === 'BOTH') && (
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: fieldErrors.iosVideoUrl ? '#EF4444' : 'var(--text-muted)' }}>
                          iOS Promo Video URL (ios_video_url)
                        </label>
                        <input
                          type="url"
                          placeholder="https://youtube.com/watch?v=ios-trailer"
                          className="input-control font-mono"
                          style={fieldErrors.iosVideoUrl ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.04)' } : {}}
                          value={iosVideoUrl}
                          onChange={(e) => {
                            setIosVideoUrl(e.target.value);
                            clearFieldError('iosVideoUrl');
                          }}
                        />
                        <FieldError field="iosVideoUrl" />
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Used for App Store video trailers or iOS promotion previews
                        </div>
                      </div>
                    )}
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

      {/* DEVELOPER ACCOUNTS MODAL (tbl_accountinfo) */}
      {showAccountModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                  Developer Accounts
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Save and manage accounts for Google Play, Apple App Store & AdMob
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
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

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Simple Add Form */}
              <form
                onSubmit={handleCreateAccount}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-pill)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                    + Add New Account
                  </span>
                  {accError && (
                    <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>
                      {accError}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Account Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NextGen Android"
                      className="input-control"
                      style={{ fontSize: '0.82rem' }}
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Platform / Type
                    </label>
                    <select
                      className="input-control"
                      style={{ fontSize: '0.82rem' }}
                      value={newAccType}
                      onChange={(e: any) => setNewAccType(e.target.value)}
                    >
                      <option value="GOOGLE_PLAY">Google Play Console (Android)</option>
                      <option value="APPLE_APP_STORE">Apple App Store (iOS)</option>
                      <option value="ADMOB">AdMob (Ads Publisher)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Developer Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="dev@example.com"
                      className="input-control"
                      style={{ fontSize: '0.82rem' }}
                      value={newAccEmail}
                      onChange={(e) => setNewAccEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Account / Pub ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="pub-xxx or Team ID"
                      className="input-control font-mono"
                      style={{ fontSize: '0.82rem' }}
                      value={newAccId}
                      onChange={(e) => setNewAccId(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={accLoading}
                    className="btn btn-primary"
                    style={{ padding: '0 16px', height: '38px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    {accLoading ? 'Saving...' : 'Add'}
                  </button>
                </div>
              </form>

              {/* Saved Accounts List */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                    Saved Developer Accounts ({accounts.length})
                  </span>
                </div>

                {accounts.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-color)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem'
                    }}
                  >
                    No custom accounts saved yet. Use the form above to add your accounts.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {accounts.map((acc) => {
                      const isAndroid = acc.store_type === 'GOOGLE_PLAY' || acc.store_type === 'ANDROID';
                      const isIos = acc.store_type === 'APPLE_APP_STORE' || acc.store_type === 'IOS';
                      const isAdmob = acc.store_type === 'ADMOB';

                      return (
                        <div
                          key={acc._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-pill)',
                            transition: 'border-color 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.1rem' }}>
                              {isAndroid ? '🤖' : isIos ? '🍏' : isAdmob ? '📊' : '💼'}
                            </span>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-heading)' }}>
                                  {acc.account_name}
                                </span>
                                <span
                                  className="badge badge-outline"
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '1px 6px',
                                    color: isAndroid ? '#10B981' : isIos ? '#3B82F6' : '#F59E0B',
                                    borderColor: isAndroid ? 'rgba(16,185,129,0.3)' : isIos ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'
                                  }}
                                >
                                  {acc.store_type || 'GLOBAL'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {acc.developer_email && <span>{acc.developer_email}</span>}
                                {acc.account_id && <span className="font-mono">ID: {acc.account_id}</span>}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc._id)}
                            title="Delete Account"
                            style={{
                              padding: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              borderRadius: '6px'
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#EF4444')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="btn btn-secondary"
                style={{ padding: '6px 18px', fontSize: '0.82rem' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
