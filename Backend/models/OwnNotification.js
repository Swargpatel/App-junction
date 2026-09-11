const mongoose = require('mongoose');

const ownNotificationSchema = new mongoose.Schema(
  {
    notification_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
    app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fcm_token: { type: String, trim: true },
    user_timezone: { type: String, default: 'UTC' },
    target_local_time: { type: String, default: '20:00' },
    dispatched_at: { type: Date },
    status: {
      type: String,
      enum: ['QUEUED', 'SENT', 'FAILED'],
      default: 'QUEUED'
    },
    error_message: { type: String, default: '' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_own_notification'
  }
);

ownNotificationSchema.index({ status: 1, user_timezone: 1 });
ownNotificationSchema.index({ notification_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('OwnNotification', ownNotificationSchema);
