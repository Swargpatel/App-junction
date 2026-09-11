const mongoose = require('mongoose');

const inAppPurchaseSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
    purchase_token: { type: String, required: true, unique: true, trim: true },
    transaction_id: { type: String, trim: true, default: '' },
    product_id: { type: String, required: true, trim: true },
    plan_name: { type: String, default: '' },
    plan_type: {
      type: String,
      enum: ['SUBSCRIPTION', 'CONSUMABLE', 'NON_CONSUMABLE'],
      default: 'SUBSCRIPTION'
    },
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    purchase_date: { type: Date, default: Date.now },
    expiry_date: { type: Date },
    auto_renewing: { type: Boolean, default: true },
    country: { type: String, default: '' },
    os_type: { type: String, enum: ['ANDROID', 'IOS', 'WEB'], default: 'ANDROID' },
    device_type: { type: String, default: 'MOBILE' },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'REFUNDED'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_inapppurchase'
  }
);

inAppPurchaseSchema.index({ app_id: 1, purchase_date: 1 });
inAppPurchaseSchema.index({ app_id: 1, status: 1 });
inAppPurchaseSchema.index({ user_id: 1 });

module.exports = mongoose.model('InAppPurchase', inAppPurchaseSchema);
