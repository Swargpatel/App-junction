const express = require('express');
const router = express.Router();

const { protectAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const { loginAdmin, getAdminProfile } = require('../controllers/adminAuthController');
const {
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
} = require('../controllers/appGroupController');

const {
  getDashboardOverview,
  getRevenueAnalytics,
  getCancellationAnalytics,
  getSubscriptionsList,
  getSubscriptionHistory,
  getUserDistribution
} = require('../controllers/analyticsController');

const {
  getCrashLogs,
  getCrashDetails,
  updateCrashStatus
} = require('../controllers/crashLogController');

const {
  createNotification,
  getNotifications,
  cancelNotification
} = require('../controllers/notificationController');

const {
  createCrossCampaign,
  getCrossCampaigns,
  toggleCampaignStatus,
  deleteCrossCampaign
} = require('../controllers/crossMarketingController');

const {
  getFeedbackList,
  updateFeedbackStatus
} = require('../controllers/feedbackController');

// ==================== AUTH ====================
router.post('/auth/login', loginAdmin);
router.get('/auth/me', protectAdmin, getAdminProfile);

// ==================== GROUPS ====================
router.get('/groups', protectAdmin, getGroups);
router.post('/groups', protectAdmin, createGroup);
router.put('/groups/:id', protectAdmin, updateGroup);
router.delete('/groups/:id', protectAdmin, deleteGroup);

// ==================== APPS ====================
router.get('/apps', protectAdmin, getApps);
router.get('/apps/:id', protectAdmin, getAppById);
router.post('/apps', protectAdmin, upload.single('app_icon'), createApp);
router.put('/apps/:id', protectAdmin, upload.single('app_icon'), updateApp);
router.post('/apps/:id/keys', protectAdmin, regenerateApiKeys);
router.delete('/apps/:id', protectAdmin, deleteApp);

// ==================== ACCOUNTS ====================
router.get('/accounts/app/:appId', protectAdmin, getAccountsByApp);
router.post('/accounts', protectAdmin, createAccount);
router.delete('/accounts/:id', protectAdmin, deleteAccount);

// ==================== ANALYTICS ====================
router.get('/analytics/overview', protectAdmin, getDashboardOverview);
router.get('/analytics/revenue', protectAdmin, getRevenueAnalytics);
router.get('/analytics/cancellations', protectAdmin, getCancellationAnalytics);
router.get('/analytics/subscriptions', protectAdmin, getSubscriptionsList);
router.get('/analytics/subscriptions/:id/history', protectAdmin, getSubscriptionHistory);
router.get('/analytics/users', protectAdmin, getUserDistribution);

// ==================== CRASH DESK ====================
router.get('/crash', protectAdmin, getCrashLogs);
router.get('/crash/:id', protectAdmin, getCrashDetails);
router.put('/crash/:id/status', protectAdmin, updateCrashStatus);

// ==================== NOTIFICATIONS ====================
router.get('/notifications', protectAdmin, getNotifications);
router.post('/notifications/create', protectAdmin, upload.single('image'), createNotification);
router.put('/notifications/:id/cancel', protectAdmin, cancelNotification);

// ==================== CROSS MARKETING ====================
router.get('/cross-marketing', protectAdmin, getCrossCampaigns);
router.post('/cross-marketing/create', protectAdmin, upload.single('poster_image'), createCrossCampaign);
router.put('/cross-marketing/:id/toggle', protectAdmin, toggleCampaignStatus);
router.delete('/cross-marketing/:id', protectAdmin, deleteCrossCampaign);

// ==================== FEEDBACK ====================
router.get('/feedback', protectAdmin, getFeedbackList);
router.put('/feedback/:id/status', protectAdmin, updateFeedbackStatus);

module.exports = router;
