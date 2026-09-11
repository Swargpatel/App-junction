const mongoose = require('mongoose');

const visitItemSchema = new mongoose.Schema(
  {
    visit_count: { type: Number, required: true },
    visit_date: { type: Date, default: Date.now },
    session_duration_seconds: { type: Number, default: 0 },
    app_version_no: { type: String, default: '' },
    device_os_version: { type: String, default: '' },
    ip_address: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  { _id: true, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const userVisitHistorySchema = new mongoose.Schema(
  {
    user_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
    device_unique_Id: { type: String, required: true },
    visits: [visitItemSchema]
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_user_visit_history'
  }
);

userVisitHistorySchema.index({ application_id: 1, device_unique_Id: 1 });

module.exports = mongoose.model('UserVisitHistory', userVisitHistorySchema);

