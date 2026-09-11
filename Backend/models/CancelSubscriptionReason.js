const mongoose = require('mongoose');

const cancellationItemSchema = new mongoose.Schema(
  {
    cancellation_count: { type: Number, default: 1 },
    reason_text: { type: String, required: true },
    custom_feedback: { type: String, default: '' },
    plan_name: { type: String, default: '' },
    total_spent: { type: Number, default: 0 },
    purchase_token: { type: String, default: '' },
    cancelled_at: { type: Date, default: Date.now }
  },
  { _id: true }
);

const cancelSubscriptionReasonSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
    device_unique_Id: { type: String, default: '' },
    inapppurchase_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InAppPurchase' },
    // Array of all cancellation events for this user
    cancellations: [cancellationItemSchema],
    total_cancellations: { type: Number, default: 1 }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_cancel_subscriptionreason'
  }
);

cancelSubscriptionReasonSchema.index({ app_id: 1 });
cancelSubscriptionReasonSchema.index({ user_id: 1, app_id: 1 });

module.exports = mongoose.model('CancelSubscriptionReason', cancelSubscriptionReasonSchema);

