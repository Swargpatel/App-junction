const mongoose = require('mongoose');
const App = require('../models/App');
const Admin = require('../models/Admin');
const ErrorLog = require('../models/ErrorLog');
const ErrorLogHistory = require('../models/ErrorLogHistory');

// Get all crash and error logs
const getCrashLogs = async (req, res) => {
  try {
    const { app_id, status, severity, source, error_source, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (app_id && mongoose.Types.ObjectId.isValid(app_id)) {
      query.app_id = app_id;
    }

    const targetSource = source || error_source;
    if (targetSource && targetSource !== 'ALL') {
      query.error_source = targetSource;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (severity && severity !== 'ALL') {
      query.severity = severity;
    }

    if (search) {
      query.$or = [
        { error_message: { $regex: search, $options: 'i' } },
        { error_title: { $regex: search, $options: 'i' } },
        { endpoint: { $regex: search, $options: 'i' } },
        { http_method: { $regex: search, $options: 'i' } },
        { file_name: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.query.startDate || req.query.endDate) {
      query.last_seen_at = {};
      if (req.query.startDate) query.last_seen_at.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.last_seen_at.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ErrorLog.countDocuments(query);

    const logs = await ErrorLog.find(query)
      .populate('app_id', 'app_name package_name app_icon')
      .populate('resolved_by', 'name email')
      .sort({ last_seen_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Summary counts (scoped to current app_id filter if any)
    const baseFilter = {};
    if (query.app_id) baseFilter.app_id = query.app_id;

    const pendingCount = await ErrorLog.countDocuments({ ...baseFilter, status: 'PENDING' });
    const inProgressCount = await ErrorLog.countDocuments({ ...baseFilter, status: 'IN_PROGRESS' });
    const resolvedCount = await ErrorLog.countDocuments({ ...baseFilter, status: 'RESOLVED' });
    const reopenedCount = await ErrorLog.countDocuments({ ...baseFilter, status: 'REOPENED' });

    const backendCount = await ErrorLog.countDocuments({ ...baseFilter, error_source: 'BACKEND_API' });
    const clientCount = await ErrorLog.countDocuments({ ...baseFilter, error_source: 'CLIENT_APP' });

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      summary: {
        pending: pendingCount,
        in_progress: inProgressCount,
        resolved: resolvedCount,
        reopened: reopenedCount,
        backend_errors: backendCount,
        client_crashes: clientCount
      },
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single crash details with full history
const getCrashDetails = async (req, res) => {
  try {
    const error = await ErrorLog.findById(req.params.id)
      .populate('app_id', 'app_name package_name')
      .populate('resolved_by', 'name email');

    if (!error) {
      return res.status(404).json({ success: false, message: 'Crash log not found' });
    }

    const history = await ErrorLogHistory.find({ error_id: error._id })
      .populate('changed_by_admin_id', 'name email')
      .sort({ created_at: -1 });

    res.json({ success: true, error, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update status of crash (Resolve, In-Progress, Reopen)
const updateCrashStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    const error = await ErrorLog.findById(id);
    if (!error) {
      return res.status(404).json({ success: false, message: 'Crash log not found' });
    }

    const previousStatus = error.status;
    error.status = status;

    if (status === 'RESOLVED') {
      error.resolved_at = new Date();
      error.resolved_by = req.admin._id;
    } else if (status === 'REOPENED') {
      error.resolved_at = null;
      error.resolved_by = null;
    }

    await error.save();

    // Audit log entry
    await ErrorLogHistory.create({
      error_id: error._id,
      app_id: error.app_id,
      changed_by_admin_id: req.admin._id,
      previous_status: previousStatus,
      new_status: status,
      resolution_notes: resolution_notes || `Status updated from ${previousStatus} to ${status}`,
      action_type: status === 'RESOLVED' ? 'RESOLVED' : status === 'REOPENED' ? 'REOPENED' : 'STATUS_CHANGE'
    });

    res.json({ success: true, message: `Bug marked as ${status}`, error });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCrashLogs,
  getCrashDetails,
  updateCrashStatus
};
