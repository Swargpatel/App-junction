const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
    account_name: { type: String, required: true, trim: true },
    store_type: {
      type: String,
      enum: ['GOOGLE_PLAY', 'APPLE_APP_STORE', 'ADMOB', 'PAYMENT_GATEWAY'],
      required: true
    },
    developer_email: { type: String, trim: true, default: '' },
    account_id: { type: String, trim: true, default: '' },
    credentials_json: { type: Object, default: {} },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_account'
  }
);

module.exports = mongoose.model('Account', accountSchema);
