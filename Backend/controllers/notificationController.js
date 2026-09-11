const Notification = require('../models/Notification');
const OwnNotification = require('../models/OwnNotification');
const User = require('../models/User');
const App = require('../models/App');

// Create a Notification Campaign (Self-Push or Group Broadcast with Timezone Logic)
const createNotification = async (req, res) => {
  try {
    const {
      app_id,
      group_id,
      title,
      message,
      target_audience,
      target_country,
      target_local_time, // e.g. "20:00" for 8:00 PM
      action_url,
      notification_type
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    let image_url = '';
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    const campaign = await Notification.create({
      app_id: app_id || null,
      group_id: group_id || null,
      title,
      message,
      image_url,
      action_url: action_url || '',
      notification_type: notification_type || 'SELF',
      target_audience: target_audience || 'ALL',
      target_country: target_country || 'ALL',
      target_local_time: target_local_time || '20:00',
      status: 'SCHEDULED',
      created_by: req.admin._id
    });

    // Populate user dispatch queue in tbl_own_notification
    const userQuery = {};
    if (app_id) userQuery.app_id = app_id;
    if (target_country && target_country !== 'ALL') userQuery.country = target_country;
    if (target_audience === 'ACTIVE_LAST_7_DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      userQuery.last_active_at = { $gte: sevenDaysAgo };
    }

    const targetedUsers = await User.find(userQuery).select('_id app_id fcm_token timezone');

    // Create queued notifications
    const ownNotifications = targetedUsers.map((u) => ({
      notification_id: campaign._id,
      app_id: u.app_id,
      user_id: u._id,
      fcm_token: u.fcm_token,
      user_timezone: u.timezone || 'UTC',
      target_local_time: target_local_time || '20:00',
      status: 'QUEUED'
    }));

    if (ownNotifications.length > 0) {
      await OwnNotification.insertMany(ownNotifications, { ordered: false }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: `Notification scheduled for ${targetedUsers.length} user(s) matching ${target_local_time || '20:00'} local time`,
      campaign,
      total_queued: targetedUsers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Notification Campaigns
const getNotifications = async (req, res) => {
  try {
    const { app_id, status } = req.query;
    const query = {};
    if (app_id) query.app_id = app_id;
    if (status && status !== 'ALL') query.status = status;

    const campaigns = await Notification.find(query)
      .populate('app_id', 'app_name package_name app_icon')
      .populate('group_id', 'group_name')
      .sort({ created_at: -1 });

    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Notification Campaign
const cancelNotification = async (req, res) => {
  try {
    const campaign = await Notification.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Notification campaign not found' });
    }

    campaign.status = 'CANCELLED';
    await campaign.save();

    await OwnNotification.updateMany(
      { notification_id: campaign._id, status: 'QUEUED' },
      { status: 'FAILED', error_message: 'Campaign cancelled by admin' }
    );

    res.json({ success: true, message: 'Campaign cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  cancelNotification
};
