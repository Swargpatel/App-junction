const mongoose = require('mongoose');

const subscriptionHistorySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
    inapppurchase_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InAppPurchase', required: true },
    transaction_id: { type: String, trim: true, default: '' },
    event_type: {
      type: String,
      enum: ['INITIAL_PURCHASE', 'AUTO_RENEWAL', 'MANUAL_RENEWAL', 'UPGRADE', 'DOWNGRADE', 'CANCELLATION'],
      default: 'AUTO_RENEWAL'
    },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    event_date: { type: Date, default: Date.now },
    previous_expiry_date: { type: Date },
    new_expiry_date: { type: Date },
    raw_payload: { type: Object, default: {} }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_subscription_history'
  }
);

subscriptionHistorySchema.index({ app_id: 1, event_date: 1 });
subscriptionHistorySchema.index({ inapppurchase_id: 1 });

module.exports = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);
