const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    group_name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    color_code: { type: String, default: '#6366F1' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'tbl_group'
  }
);

module.exports = mongoose.model('Group', groupSchema);
