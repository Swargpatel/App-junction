const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Application Reference
    application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
    app_name: { type: String, default: '' },

    // Device Identifier
    device_unique_Id: { type: String, required: true, trim: true },

    // Push Notifications
    push_notification_token: { type: String, trim: true, default: '' },
    is_notification_allow: { type: Boolean, default: true },
    notification_send_datetime: { type: Date },

    // Device Specifications
    device_OsType: { type: String, enum: ['Android', 'iOS', 'Web', 'ANDROID', 'IOS', 'WEB'], default: 'Android' },
    device_type: { type: String, default: 'Phone' }, // TV / Tablet / Web / Phone
    device_brand: { type: String, default: '' }, // Apple / Samsung / MI / Google
    device_company: { type: String, default: '' },
    device_os_version: { type: String, default: '' },

    // Location & Timezone
    country: { type: String, default: 'Unknown' },
    country_code: { type: String, default: 'UN' },
    timezone: { type: String, default: 'UTC' }, // e.g. "Asia/Kolkata", "America/New_York"
    ip_address: { type: String, default: '' },

    // App Versioning
    app_version_no: { type: String, default: '1.0.0' },
    app_build_no: { type: String, default: '1' },

    // Engagement & Economy
    visit_count: { type: Number, default: 1 },
    user_coin: { type: Number, default: 0 },

    // User Identity (Optional Social / Auth Info)
    Email_ID: { type: String, trim: true, default: '' },
    Google_ID: { type: String, trim: true, default: '' },
    apple_ID: { type: String, trim: true, default: '' },
    Phonenumber: { type: String, trim: true, default: '' },
    OTP: { type: String, trim: true, default: '' },

    // Status & Lifecycle
    first_installed_at: { type: Date, default: Date.now },
    last_active_at: { type: Date, default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'UNINSTALLED', 'BLOCKED'], default: 'ACTIVE' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_user'
  }
);

// Indexes
userSchema.index({ application_id: 1, device_unique_Id: 1 }, { unique: true });
userSchema.index({ country: 1, timezone: 1 });
userSchema.index({ created_at: 1 });

module.exports = mongoose.model('User', userSchema);
