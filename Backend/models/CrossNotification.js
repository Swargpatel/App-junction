const mongoose = require('mongoose');

const crossNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    source_app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App' }, // Which app displays the ad
    target_group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // Display across all apps in group
    destination_app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true }, // App being promoted
    poster_image_url: { type: String, required: true },
    custom_message: { type: String, default: '' },
    target_button_text: { type: String, default: 'Install Now' },
    destination_store_url: { type: String, default: '' },
    impressions_count: { type: Number, default: 0 },
    clicks_count: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED'],
      default: 'ACTIVE'
    },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_cross_notification'
  }
);

crossNotificationSchema.index({ status: 1, source_app_id: 1 });
crossNotificationSchema.index({ status: 1, target_group_id: 1 });

module.exports = mongoose.model('CrossNotification', crossNotificationSchema);
