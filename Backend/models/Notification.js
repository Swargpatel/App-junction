const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App' },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    image_url: { type: String, default: '' },
    action_url: { type: String, default: '' },
    notification_type: {
      type: String,
      enum: ['SELF', 'CROSS'],
      default: 'SELF'
    },
    target_audience: {
      type: String,
      enum: ['ALL', 'ACTIVE_LAST_7_DAYS', 'INACTIVE_30_DAYS', 'COUNTRY_SPECIFIC'],
      default: 'ALL'
    },
    target_country: { type: String, default: 'ALL' },
    target_local_time: { type: String, default: '20:00' }, // e.g. "20:00" = 8:00 PM in user's country
    scheduled_date: { type: Date, default: Date.now },
    is_recurring_daily: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED'
    },
    total_sent: { type: Number, default: 0 },
    total_failed: { type: Number, default: 0 },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_notification'
  }
);

notificationSchema.index({ status: 1, target_local_time: 1 });
notificationSchema.index({ app_id: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
