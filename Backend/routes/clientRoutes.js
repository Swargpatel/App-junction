const express = require('express');
const router = express.Router();

const { verifyClientApiKey } = require('../middlewares/auth');

const {
  initApp,
  recordVisit,
  syncIap,
  submitCancelReason,
  reportCrash,
  submitFeedback,
  getActiveCrossBanners,
  trackCrossAdInteraction
} = require('../controllers/clientController');

// All client routes require a valid x-api-key header corresponding to a registered active app
router.use(verifyClientApiKey);

// App Lifecycle
router.post('/app/init', initApp);
router.post('/visit', recordVisit);

// Monetization & Churn
router.post('/iap/sync', syncIap);
router.post('/subscription/cancel', submitCancelReason);

// Crashes & Bugs
router.post('/crash/report', reportCrash);

// Feedback & Ratings
router.post('/feedback', submitFeedback);

// Cross Marketing
router.get('/cross-marketing/active', getActiveCrossBanners);
router.post('/cross-marketing/interaction', trackCrossAdInteraction);

module.exports = router;
