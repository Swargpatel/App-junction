const mongoose = require('mongoose');

const errorLogHistorySchema = new mongoose.Schema(
  {
    error_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ErrorLog', required: true },
    app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', default: null },
    changed_by_admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    previous_status: { type: String, default: '' },
    new_status: { type: String, required: true },
    resolution_notes: { type: String, default: '' },
    action_type: {
      type: String,
      enum: ['STATUS_CHANGE', 'NOTE_ADDED', 'RESOLVED', 'REOPENED', 'AUTO_DETECTED_REOPEN'],
      default: 'STATUS_CHANGE'
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_errorlogshistory'
  }
);

errorLogHistorySchema.index({ error_id: 1, created_at: -1 });

module.exports = mongoose.model('ErrorLogHistory', errorLogHistorySchema);
