const mongoose = require('mongoose');
const crypto = require('crypto');

const appSchema = new mongoose.Schema(
  {
    // Basic Info
    app_name: { type: String, required: true, trim: true },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    android_package_name: { type: String, trim: true, default: '' },
    ios_bundle_id: { type: String, trim: true, default: '' },
    package_name: { type: String, required: true, unique: true, trim: true }, // Unified package identifier
    app_age_rating: { type: String, default: '3+' },
    logo_photo: { type: String, default: '' },
    app_icon: { type: String, default: '' },

    // Security & API Keys
    app_key: {
      type: String,
      unique: true
    },
    api_key: {
      type: String,
      unique: true
    },
    api_secret: {
      type: String,
      default: () => crypto.randomBytes(32).toString('hex')
    },

    // Platform Live Status
    platform: { type: String, enum: ['ANDROID', 'IOS', 'BOTH'], default: 'ANDROID' },
    is_android_live: { type: Boolean, default: true },
    is_iOS_live: { type: Boolean, default: false },

    // Store URLs & Availability
    googleplay_link: { type: String, default: '' },
    appstore_link: { type: String, default: '' },
    store_url_android: { type: String, default: '' },
    store_url_ios: { type: String, default: '' },
    is_not_available_playstore: { type: Boolean, default: false },
    new_google_play_link: { type: String, default: '' },
    is_not_available_appstore: { type: Boolean, default: false },
    new_apple_app_link: { type: String, default: '' },

    // Developer Accounts
    google_play_account: { type: String, default: '' },
    apple_app_store_account: { type: String, default: '' },
    ads_account: { type: String, default: '' },

    // Build Numbers & Version
    app_version: { type: String, default: '1.0.0' },
    android_latest_build_number: { type: String, default: '1' },
    ios_latest_build_number: { type: String, default: '1' },

    // Push Notifications & Firebase
    Firebase_push_key: { type: String, default: '' },
    firebase_server_key: { type: String, default: '' },
    firebase_service_account_json: { type: String, default: '' },
    firebase_project_id: { type: String, default: '' },
    firebase_client_email: { type: String, default: '' },
    is_push_marketing: { type: Boolean, default: true },
    is_cross_push_marketing: { type: Boolean, default: true },

    // Marketing Flags & Banners
    is_cross_app_ads_banner_marketing: { type: Boolean, default: true },
    is_adsbanner_marketing: { type: Boolean, default: true },
    vertical_banner_photo: [{ type: String }],
    horizontal_banner_photo: [{ type: String }],

    // Notification Preferences & Frequency
    Own_notification_timePrefrance: { type: String, default: '20:00' }, // 8:00 PM
    Cross_app_notification_time_prefrance: { type: String, default: '20:00' },
    Own_app_notification_frequancy: { type: String, default: '1' }, // In days
    Cross_app_notification_frequancy: { type: String, default: '2' },
    own_app_notification_message: [{ type: String }],
    cross_notification_message_text: [{ type: String }],

    // Media & Policy URLs
    android_video_url: { type: String, default: '' },
    ios_video_url: { type: String, default: '' },
    Android_ads_policy_URL: { type: String, default: '' },
    iOS_ads_policy_URL: { type: String, default: '' },

    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
  },
  {
    timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
    collection: 'tbl_app'
  }
);

// Always ensure app_key and api_key are identical
appSchema.pre('validate', function () {
  const unifiedKey = this.app_key || this.api_key || ('app_' + crypto.randomBytes(16).toString('hex'));
  this.app_key = unifiedKey;
  this.api_key = unifiedKey;
  if (!this.api_secret) {
    this.api_secret = crypto.randomBytes(32).toString('hex');
  }
});

appSchema.pre('save', function () {
  const unifiedKey = this.app_key || this.api_key || ('app_' + crypto.randomBytes(16).toString('hex'));
  this.app_key = unifiedKey;
  this.api_key = unifiedKey;
  if (!this.api_secret) {
    this.api_secret = crypto.randomBytes(32).toString('hex');
  }
});

module.exports = mongoose.model('App', appSchema);
