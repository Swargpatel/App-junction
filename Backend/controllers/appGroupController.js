const mongoose = require('mongoose');
const crypto = require('crypto');
const Group = require('../models/Group');
const App = require('../models/App');
const Account = require('../models/Account');

// ==================== GROUP CONTROLLERS ====================

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().sort({ created_at: -1 }).lean();
    const groupsWithApps = await Promise.all(
      groups.map(async (grp) => {
        const assignedApps = await App.find({ group_id: grp._id })
          .select('_id app_name package_name logo_photo app_icon platform app_version')
          .lean();
        return {
          ...grp,
          app_count: assignedApps.length,
          apps: assignedApps
        };
      })
    );
    res.json({ success: true, count: groupsWithApps.length, groups: groupsWithApps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const { group_name, description, color_code, icon, app_ids } = req.body;
    if (!group_name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const existing = await Group.findOne({ group_name: group_name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A group with this name already exists' });
    }

    const group = await Group.create({
      group_name: group_name.trim(),
      description: description || '',
      color_code: color_code || '#6366F1',
      icon: icon || ''
    });

    // Assign multiple applications to this new group if selected
    if (Array.isArray(app_ids) && app_ids.length > 0) {
      await App.updateMany(
        { _id: { $in: app_ids } },
        { group_id: group._id }
      );
    }

    res.status(201).json({ success: true, message: 'Group created successfully', group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { group_name, description, color_code, icon, status, app_ids } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group_name) group.group_name = group_name.trim();
    if (description !== undefined) group.description = description;
    if (color_code) group.color_code = color_code;
    if (icon !== undefined) group.icon = icon;
    if (status) group.status = status;

    await group.save();

    // Assign multiple applications to this group if selected
    if (Array.isArray(app_ids)) {
      await App.updateMany(
        { _id: { $in: app_ids } },
        { group_id: group._id }
      );
    }

    res.json({ success: true, message: 'Group updated successfully', group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const appCount = await App.countDocuments({ group_id: id });
    if (appCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete group: contains ${appCount} registered application(s). Reassign or delete apps first.`
      });
    }

    await Group.findByIdAndDelete(id);
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== APP CONTROLLERS ====================

const getApps = async (req, res) => {
  try {
    const { group_id, platform, status, search } = req.query;
    const query = {};

    if (group_id) query.group_id = group_id;
    if (platform) query.platform = platform;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { app_name: { $regex: search, $options: 'i' } },
        { package_name: { $regex: search, $options: 'i' } },
        { android_package_name: { $regex: search, $options: 'i' } }
      ];
    }

    const apps = await App.find(query).populate('group_id').sort({ create_date: -1 });
    res.json({ success: true, count: apps.length, apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAppById = async (req, res) => {
  try {
    const app = await App.findById(req.params.id).populate('group_id');
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const accounts = await Account.find({ app_id: app._id });
    res.json({ success: true, app, accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createApp = async (req, res) => {
  try {
    const body = req.body;
    const app_name = body.app_name?.trim();
    const group_id = body.group_id;
    const android_package_name = body.android_package_name?.trim() || body.package_name?.trim();
    const ios_bundle_id = body.ios_bundle_id?.trim() || body.bundle_id?.trim() || '';
    const package_name = android_package_name || ios_bundle_id;

    if (!app_name || !package_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide app_name and android_package_name (or package_name)'
      });
    }

    let validGroupId = null;
    if (group_id && mongoose.Types.ObjectId.isValid(group_id)) {
      const group = await Group.findById(group_id);
      if (group) {
        validGroupId = group._id;
      }
    }

    const existingPackage = await App.findOne({ package_name });
    if (existingPackage) {
      return res.status(400).json({
        success: false,
        message: 'An application with this package name already exists'
      });
    }

    let logo_photo = '';
    if (req.file) {
      logo_photo = `/uploads/${req.file.filename}`;
    } else if (body.logo_photo) {
      logo_photo = body.logo_photo;
    } else if (body.app_icon) {
      logo_photo = body.app_icon;
    }

    const app = await App.create({
      app_name,
      group_id: validGroupId,
      package_name,
      android_package_name: android_package_name || package_name,
      ios_bundle_id,
      platform: body.platform || 'ANDROID',
      app_age_rating: body.app_age_rating || '3+',
      logo_photo,
      app_icon: logo_photo,
      app_version: body.app_version || '1.0.0',
      android_latest_build_number: body.android_latest_build_number || '1',
      ios_latest_build_number: body.ios_latest_build_number || '1',
      is_android_live: body.is_android_live !== undefined ? body.is_android_live : true,
      is_iOS_live: body.is_iOS_live !== undefined ? body.is_iOS_live : false,
      googleplay_link: body.googleplay_link || body.store_url_android || '',
      appstore_link: body.appstore_link || body.store_url_ios || '',
      store_url_android: body.googleplay_link || body.store_url_android || '',
      store_url_ios: body.appstore_link || body.store_url_ios || '',
      Firebase_push_key: body.Firebase_push_key || body.firebase_server_key || '',
      firebase_server_key: body.Firebase_push_key || body.firebase_server_key || '',
      firebase_service_account_json: body.firebase_service_account_json || '',
      firebase_project_id: body.firebase_project_id || '',
      firebase_client_email: body.firebase_client_email || '',
      is_push_marketing: body.is_push_marketing !== undefined ? body.is_push_marketing : true,
      is_cross_push_marketing: body.is_cross_push_marketing !== undefined ? body.is_cross_push_marketing : true,
      is_cross_app_ads_banner_marketing: body.is_cross_app_ads_banner_marketing !== undefined ? body.is_cross_app_ads_banner_marketing : true,
      is_adsbanner_marketing: body.is_adsbanner_marketing !== undefined ? body.is_adsbanner_marketing : true,
      Own_notification_timePrefrance: body.Own_notification_timePrefrance || '20:00',
      Cross_app_notification_time_prefrance: body.Cross_app_notification_time_prefrance || '20:00',
      Own_app_notification_frequancy: body.Own_app_notification_frequancy || '1',
      Cross_app_notification_frequancy: body.Cross_app_notification_frequancy || '2',
      android_video_url: body.android_video_url || '',
      ios_video_url: body.ios_video_url || '',
      Android_ads_policy_URL: body.Android_ads_policy_URL || '',
      iOS_ads_policy_URL: body.iOS_ads_policy_URL || '',
      google_play_account: body.google_play_account || '',
      apple_app_store_account: body.apple_app_store_account || '',
      ads_account: body.ads_account || '',
      status: 'ACTIVE'
    });

    const populated = await App.findById(app._id).populate('group_id');
    res.status(201).json({ success: true, message: 'Application registered successfully', app: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateApp = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await App.findById(id);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const updatableFields = [
      'app_name', 'android_package_name', 'ios_bundle_id', 'group_id', 'platform',
      'app_age_rating', 'app_version', 'android_latest_build_number', 'ios_latest_build_number',
      'is_android_live', 'is_iOS_live', 'googleplay_link', 'appstore_link',
      'store_url_android', 'store_url_ios', 'Firebase_push_key', 'firebase_server_key',
      'firebase_service_account_json', 'firebase_project_id', 'firebase_client_email',
      'is_push_marketing', 'is_cross_push_marketing', 'is_cross_app_ads_banner_marketing',
      'is_adsbanner_marketing', 'Own_notification_timePrefrance', 'Cross_app_notification_time_prefrance',
      'Own_app_notification_frequancy', 'Cross_app_notification_frequancy', 'android_video_url',
      'ios_video_url', 'Android_ads_policy_URL', 'iOS_ads_policy_URL', 'google_play_account',
      'apple_app_store_account', 'ads_account', 'status'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        app[field] = req.body[field];
      }
    });

    if (req.file) {
      app.logo_photo = `/uploads/${req.file.filename}`;
      app.app_icon = `/uploads/${req.file.filename}`;
    }

    await app.save();
    const updated = await App.findById(app._id).populate('group_id');
    res.json({ success: true, message: 'Application updated successfully', app: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const regenerateApiKeys = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await App.findById(id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const newKey = 'app_' + crypto.randomBytes(16).toString('hex');
    app.app_key = newKey;
    app.api_key = newKey;
    app.api_secret = crypto.randomBytes(32).toString('hex');
    await app.save();

    res.json({
      success: true,
      message: 'API Key regenerated successfully',
      app_key: app.app_key,
      api_key: app.api_key,
      api_secret: app.api_secret
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteApp = async (req, res) => {
  try {
    const { id } = req.params;
    await App.findByIdAndDelete(id);
    await Account.deleteMany({ app_id: id });
    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAccountsByApp = async (req, res) => {
  try {
    const { appId } = req.params;
    const accounts = await Account.find({ app_id: appId }).sort({ create_date: -1 });
    res.json({ success: true, accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAccount = async (req, res) => {
  try {
    const { app_id, account_name, store_type, developer_email, account_id, credentials_json } = req.body;
    if (!app_id || !account_name || !store_type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide app_id, account_name, and store_type'
      });
    }

    const account = await Account.create({
      app_id,
      account_name,
      store_type,
      developer_email: developer_email || '',
      account_id: account_id || '',
      credentials_json: credentials_json || {}
    });

    res.status(201).json({ success: true, message: 'Account added successfully', account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getApps,
  getAppById,
  createApp,
  updateApp,
  regenerateApiKeys,
  deleteApp,
  getAccountsByApp,
  createAccount,
  deleteAccount
};
