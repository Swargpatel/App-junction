const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback_text: { type: String, required: true, trim: true },
    user_email: { type: String, trim: true, default: '' },
    app_version: { type: String, default: '' },
    device_info: { type: String, default: '' },
    os_version: { type: String, default: '' },
    status: { type: String, enum: ['NEW', 'REVIEWED', 'ARCHIVED'], default: 'NEW' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_feedback'
  }
);

feedbackSchema.index({ app_id: 1, created_at: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
