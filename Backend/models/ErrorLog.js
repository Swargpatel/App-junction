const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema(
  {
    app_id: { type: mongoose.Schema.Types.ObjectId, ref: 'App', default: null },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    error_source: {
      type: String,
      enum: ['BACKEND_API', 'CLIENT_APP'],
      default: 'BACKEND_API'
    },
    endpoint: { type: String, default: '', trim: true },
    http_method: { type: String, default: 'POST', trim: true },
    status_code: { type: Number, default: 500 },
    request_payload: { type: mongoose.Schema.Types.Mixed, default: null },
    request_query: { type: mongoose.Schema.Types.Mixed, default: null },
    request_headers: { type: mongoose.Schema.Types.Mixed, default: null },
    response_body: { type: mongoose.Schema.Types.Mixed, default: null },
    ip_address: { type: String, default: '' },
    user_agent: { type: String, default: '' },

    error_hash: { type: String, trim: true }, // Hash of message + endpoint + code to group repeating bugs
    error_title: { type: String, default: 'API Failure' },
    error_message: { type: String, required: true },
    stack_trace: { type: String, default: '' },
    file_name: { type: String, default: '' },
    line_number: { type: Number, default: 0 },
    os_type: { type: String, enum: ['ANDROID', 'IOS', 'WEB', 'BACKEND', 'SERVER'], default: 'BACKEND' },
    os_version: { type: String, default: '' },
    device_model: { type: String, default: '' },
    app_version: { type: String, default: '1.0.0' },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH'
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'],
      default: 'PENDING'
    },
    occurrences_count: { type: Number, default: 1 },
    first_seen_at: { type: Date, default: Date.now },
    last_seen_at: { type: Date, default: Date.now },
    resolved_at: { type: Date },
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_errorlogs'
  }
);

errorLogSchema.index({ app_id: 1, status: 1 });
errorLogSchema.index({ error_source: 1, status: 1 });
errorLogSchema.index({ error_hash: 1 });
errorLogSchema.index({ endpoint: 1, status_code: 1 });
errorLogSchema.index({ last_seen_at: -1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);

