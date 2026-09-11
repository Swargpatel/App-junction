const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const App = require('../models/App');

// Protect routes for Admin Web Panel
const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'app_junction_super_secret_jwt_key_2026_x89f');
    const admin = await Admin.findById(decoded.id).select('-password_hash');

    if (!admin || admin.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Admin account inactive or not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid', error: error.message });
  }
};

// Verify Mobile App Client API Key (supports api_key, app_key, and MongoDB _id)
const mongoose = require('mongoose');

const verifyClientApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'Missing x-api-key header' });
    }

    const query = mongoose.Types.ObjectId.isValid(apiKey)
      ? { $or: [{ _id: apiKey }, { api_key: apiKey }, { app_key: apiKey }], status: 'ACTIVE' }
      : { $or: [{ api_key: apiKey }, { app_key: apiKey }], status: 'ACTIVE' };

    const app = await App.findOne(query).populate('group_id');
    if (!app) {
      return res.status(403).json({ success: false, message: 'Invalid or inactive Application API key' });
    }

    req.registeredApp = app;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'API Key verification failed', error: error.message });
  }
};

module.exports = {
  protectAdmin,
  verifyClientApiKey
};
