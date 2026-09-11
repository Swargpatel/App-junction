const crypto = require('crypto');
const User = require('../models/User');
const UserVisitHistory = require('../models/UserVisitHistory');
const InAppPurchase = require('../models/InAppPurchase');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const CancelSubscriptionReason = require('../models/CancelSubscriptionReason');
const Feedback = require('../models/Feedback');
const ErrorLog = require('../models/ErrorLog');
const ErrorLogHistory = require('../models/ErrorLogHistory');
const CrossNotification = require('../models/CrossNotification');

// ==================== APP INIT / LAUNCH ====================
// Common API called on mobile app launch
const initApp = async (req, res) => {
  try {
    const app = req.registeredApp;
    const body = req.body;

    const device_unique_Id = body.device_unique_Id || body.device_id;
    if (!device_unique_Id) {
      return res.status(400).json({ success: false, message: 'device_unique_Id (or device_id) is required' });
    }

    const push_notification_token = body.push_notification_token || body.fcm_token || '';
    const device_OsType = body.device_OsType || body.os_type || (app.platform === 'IOS' ? 'iOS' : 'Android');
    const device_type = body.device_type || body['device-type'] || 'Phone';
    const device_brand = body.device_brand || body.device_company || '';
    const device_company = body.device_company || body.device_brand || '';
    const device_os_version = body.device_os_version || body.os_version || '';
    const country = body.country || 'Unknown';
    const Countrycode = body.Countrycode || body.country_code || 'UN';
    const timezone = body.timezone || 'UTC';
    const app_version_no = body.app_version_no || body.app_version || app.app_version || '1.0.0';
    const app_build_no = body.app_build_no || '1';
    const is_notification_allow = body.is_notification_allow !== undefined ? body.is_notification_allow : true;

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    // Check if user/device already exists for this app
    let user = await User.findOne({
      application_id: app._id,
      device_unique_Id
    });

    let isNewUser = false;
    let currentVisitCount = 1;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        application_id: app._id,
        app_name: app.app_name,
        device_unique_Id,
        push_notification_token,
        device_OsType,
        device_type,
        device_brand,
        device_company,
        device_os_version,
        country,
        country_code: Countrycode,
        timezone,
        app_version_no,
        app_build_no,
        is_notification_allow,
        Email_ID: body.Email_ID || '',
        Google_ID: body.Google_ID || '',
        apple_ID: body.apple_ID || '',
        Phonenumber: body.Phonenumber || '',
        visit_count: 1,
        user_coin: body.user_coin || 0,
        ip_address: clientIp,
        first_installed_at: new Date(),
        last_active_at: new Date(),
        status: 'ACTIVE'
      });
    } else {
      // Returning user - increment visit_count and update metadata
      user.visit_count = (user.visit_count || 1) + 1;
      currentVisitCount = user.visit_count;
      user.last_active_at = new Date();

      if (push_notification_token) user.push_notification_token = push_notification_token;
      if (app_version_no) user.app_version_no = app_version_no;
      if (app_build_no) user.app_build_no = app_build_no;
      if (timezone) user.timezone = timezone;
      if (country && country !== 'Unknown') user.country = country;
      if (Countrycode && Countrycode !== 'UN') user.country_code = Countrycode;
      if (body.Email_ID) user.Email_ID = body.Email_ID;
      if (body.Google_ID) user.Google_ID = body.Google_ID;
      if (body.apple_ID) user.apple_ID = body.apple_ID;
      if (body.Phonenumber) user.Phonenumber = body.Phonenumber;
      if (body.is_notification_allow !== undefined) user.is_notification_allow = is_notification_allow;

      await user.save();

      // Store in UserVisitHistory ONLY when returning user hits the API again (2nd time onwards)
      await UserVisitHistory.findOneAndUpdate(
        { user_ID: user._id },
        {
          $setOnInsert: {
            user_ID: user._id,
            application_id: app._id,
            device_unique_Id
          },
          $push: {
            visits: {
              visit_count: currentVisitCount,
              visit_date: new Date(),
              session_duration_seconds: body.session_duration_seconds || 0,
              app_version_no,
              device_os_version,
              ip_address: clientIp,
              country: user.country
            }
          }
        },
        { upsert: true, new: true }
      );
    }

    // Fetch active cross marketing promotions for this app or its group
    const activePromotions = await CrossNotification.find({
      status: 'ACTIVE',
      $or: [
        { source_app_id: app._id },
        { target_group_id: app.group_id._id || app.group_id }
      ]
    })
      .populate('destination_app_id', 'app_name package_name app_icon store_url_android store_url_ios')
      .limit(5);

    res.json({
      success: true,
      message: isNewUser ? 'New user registered' : 'Returning user session verified',
      is_new_user: isNewUser,
      user_id: user._id,
      app_info: {
        app_name: app.app_name,
        package_name: app.package_name,
        latest_version: app.app_version
      },
      active_promotions: activePromotions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'App init failed', error: error.message });
  }
};

// ==================== VISIT HEARTBEAT ====================
const recordVisit = async (req, res) => {
  try {
    const app = req.registeredApp;
    const device_id = req.body.device_unique_Id || req.body.device_id;

    if (!device_id) {
      return res.status(400).json({ success: false, message: 'device_unique_Id is required' });
    }

    const user = await User.findOne({ application_id: app._id, device_unique_Id: device_id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not registered for this app' });
    }

    user.visit_count = (user.visit_count || 1) + 1;
    user.last_active_at = new Date();
    await user.save();

    await UserVisitHistory.findOneAndUpdate(
      { user_ID: user._id },
      {
        $setOnInsert: {
          user_ID: user._id,
          application_id: app._id,
          device_unique_Id: device_id
        },
        $push: {
          visits: {
            visit_count: user.visit_count,
            visit_date: new Date(),
            session_duration_seconds: req.body.session_duration_seconds || 0,
            app_version_no: user.app_version_no,
            device_os_version: user.device_os_version,
            ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
            country: user.country
          }
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Visit recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== IN-APP PURCHASE & SUBSCRIPTION SYNC ====================
const syncIap = async (req, res) => {
  try {
    const app = req.registeredApp;
    const {
      purchase_token,
      transaction_id,
      product_id,
      plan_name,
      plan_type,
      amount,
      currency,
      expiry_date,
      auto_renewing,
      raw_payload
    } = req.body;
    const device_id = req.body.device_unique_Id || req.body.device_id;

    if (!device_id || !purchase_token || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'device_unique_Id, purchase_token, and product_id are required'
      });
    }

    const user = await User.findOne({ application_id: app._id, device_unique_Id: device_id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not registered' });
    }

    let iap = await InAppPurchase.findOne({ purchase_token });
    let isRenewal = false;

    if (!iap) {
      // New Purchase
      iap = await InAppPurchase.create({
        user_id: user._id,
        app_id: app._id,
        purchase_token,
        transaction_id: transaction_id || '',
        product_id,
        plan_name: plan_name || product_id,
        plan_type: plan_type || 'SUBSCRIPTION',
        amount: Number(amount) || 0,
        currency: currency || 'USD',
        purchase_date: new Date(),
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        auto_renewing: auto_renewing !== undefined ? auto_renewing : true,
        country: user.country,
        os_type: user.os_type,
        device_type: 'MOBILE',
        status: 'ACTIVE'
      });
    } else {
      // Renewal or update
      isRenewal = true;
      const prevExpiry = iap.expiry_date;
      iap.expiry_date = expiry_date ? new Date(expiry_date) : iap.expiry_date;
      iap.auto_renewing = auto_renewing !== undefined ? auto_renewing : iap.auto_renewing;
      iap.status = 'ACTIVE';
      if (amount) iap.amount = Number(amount);
      await iap.save();

      // Log renewal history
      await SubscriptionHistory.create({
        user_id: user._id,
        app_id: app._id,
        inapppurchase_id: iap._id,
        transaction_id: transaction_id || '',
        event_type: 'AUTO_RENEWAL',
        amount: Number(amount) || iap.amount,
        currency: currency || iap.currency,
        event_date: new Date(),
        previous_expiry_date: prevExpiry,
        new_expiry_date: iap.expiry_date,
        raw_payload: raw_payload || {}
      });
    }

    // Also record initial purchase history if new
    if (!isRenewal) {
      await SubscriptionHistory.create({
        user_id: user._id,
        app_id: app._id,
        inapppurchase_id: iap._id,
        transaction_id: transaction_id || '',
        event_type: 'INITIAL_PURCHASE',
        amount: Number(amount) || 0,
        currency: currency || 'USD',
        event_date: new Date(),
        new_expiry_date: iap.expiry_date,
        raw_payload: raw_payload || {}
      });
    }

    res.json({
      success: true,
      message: isRenewal ? 'Subscription renewed successfully' : 'Purchase synced successfully',
      purchase: iap
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'IAP sync failed', error: error.message });
  }
};

// ==================== SUBSCRIPTION CANCELLATION ====================
// Submit user subscription cancellation feedback (Single Unified API)
const submitCancelReason = async (req, res) => {
  try {
    const app = req.registeredApp;
    const body = req.body;

    const userDevice = body.device_unique_Id || body.device_id;
    const reasonText = body.cancellation_reason || body.reason_text || body.reason || 'Subscription Cancelled';
    const customFeedback = body.custom_feedback || body.feedback || '';
    const purchaseToken = body.purchase_token || '';

    if (!userDevice) {
      return res.status(400).json({ success: false, message: 'device_unique_Id is required' });
    }

    let user = await User.findOne({ application_id: app._id, device_unique_Id: userDevice });
    if (!user) {
      user = await User.create({
        application_id: app._id,
        device_unique_Id: userDevice,
        os_type: body.os_type || 'ANDROID',
        app_version_no: body.app_version_no || '1.0.0',
        country: body.country || 'IN',
        visit_count: 1,
        last_active_at: new Date()
      });
    }

    let iap = null;
    if (purchaseToken) {
      iap = await InAppPurchase.findOne({ purchase_token: purchaseToken });
      if (iap) {
        iap.status = 'CANCELLED';
        iap.auto_renewing = false;
        await iap.save();

        await SubscriptionHistory.create({
          user_id: user._id,
          app_id: app._id,
          inapppurchase_id: iap._id,
          event_type: 'CANCELLATION',
          amount: 0,
          currency: iap.currency,
          event_date: new Date()
        });
      }
    }

    const planName = body.plan_name || (iap ? iap.plan_name : '');
    const totalSpent = Number(body.total_spent || body.amount) || (iap ? iap.amount : 0);

    const newCancellationItem = {
      cancellation_count: 1,
      reason_text: reasonText,
      custom_feedback: customFeedback,
      plan_name: planName,
      total_spent: totalSpent,
      purchase_token: purchaseToken,
      cancelled_at: new Date()
    };

    let cancelRecord = await CancelSubscriptionReason.findOne({ user_id: user._id, app_id: app._id });

    if (!cancelRecord) {
      newCancellationItem.cancellation_count = 1;
      cancelRecord = await CancelSubscriptionReason.create({
        user_id: user._id,
        app_id: app._id,
        device_unique_Id: userDevice,
        inapppurchase_id: iap ? iap._id : null,
        cancellations: [newCancellationItem],
        total_cancellations: 1
      });
    } else {
      const nextCount = (cancelRecord.total_cancellations || cancelRecord.cancellations?.length || 1) + 1;
      newCancellationItem.cancellation_count = nextCount;

      if (!Array.isArray(cancelRecord.cancellations)) {
        cancelRecord.cancellations = [];
      }
      cancelRecord.cancellations.push(newCancellationItem);
      cancelRecord.total_cancellations = nextCount;
      if (iap) cancelRecord.inapppurchase_id = iap._id;

      await cancelRecord.save();
    }

    res.json({
      success: true,
      message: 'Cancellation feedback submitted successfully',
      cancelRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CRASH & ERROR REPORTING ====================
const reportCrash = async (req, res) => {
  try {
    const app = req.registeredApp;
    const {
      device_id,
      device_unique_Id,
      error_title,
      error_message,
      stack_trace,
      file_name,
      line_number,
      severity,
      os_version,
      device_model,
      app_version
    } = req.body;

    if (!error_message) {
      return res.status(400).json({ success: false, message: 'error_message is required' });
    }

    const userDevice = device_unique_Id || device_id;
    let user = null;
    if (userDevice) {
      user = await User.findOne({ application_id: app._id, device_unique_Id: userDevice });
      if (!user) {
        // Auto register user so crash is always linked to a valid user_id
        user = await User.create({
          application_id: app._id,
          app_name: app.app_name,
          device_unique_Id: userDevice,
          device_OsType: req.body.os_type || 'ANDROID',
          device_brand: req.body.device_model || '',
          device_os_version: req.body.os_version || '',
          app_version_no: req.body.app_version || '1.0.0',
          country: req.body.country || 'Unknown',
          first_installed_at: new Date(),
          last_active_at: new Date(),
          status: 'ACTIVE'
        });
      }
    }

    // Compute unique error hash to deduplicate repeating crashes
    const errorHash = crypto
      .createHash('md5')
      .update(`${error_message}_${file_name || ''}_${line_number || 0}`)
      .digest('hex');

    let existingError = await ErrorLog.findOne({ app_id: app._id, error_hash: errorHash });

    if (existingError) {
      existingError.occurrences_count += 1;
      existingError.last_seen_at = new Date();

      // If the error was previously marked as RESOLVED, auto reopen it!
      if (existingError.status === 'RESOLVED') {
        const prevStatus = existingError.status;
        existingError.status = 'REOPENED';
        await existingError.save();

        await ErrorLogHistory.create({
          error_id: existingError._id,
          app_id: app._id,
          previous_status: prevStatus,
          new_status: 'REOPENED',
          resolution_notes: 'Bug automatically reopened by incoming crash report from mobile client',
          action_type: 'AUTO_DETECTED_REOPEN'
        });
      } else {
        await existingError.save();
      }

      return res.json({ success: true, message: 'Error occurrence logged', error_id: existingError._id });
    }

    const normalizedOs = (req.body.os_type || (user ? user.os_type : 'ANDROID') || 'ANDROID').toUpperCase();
    const validOs = ['ANDROID', 'IOS', 'WEB'].includes(normalizedOs) ? normalizedOs : 'ANDROID';

    // New crash report
    const newError = await ErrorLog.create({
      app_id: app._id,
      user_id: user ? user._id : null,
      error_source: 'CLIENT_APP',
      error_hash: errorHash,
      error_title: error_title || 'App Crash / Unhandled Exception',
      error_message,
      stack_trace: stack_trace || '',
      file_name: file_name || '',
      line_number: Number(line_number) || 0,
      os_type: validOs,
      os_version: os_version || (user ? user.device_os_version : ''),
      device_model: device_model || (user ? user.device_brand : ''),
      app_version: app_version || (user ? user.app_version_no : app.app_version),
      severity: (severity || 'HIGH').toUpperCase(),
      status: 'PENDING',
      occurrences_count: 1,
      first_seen_at: new Date(),
      last_seen_at: new Date()
    });

    await ErrorLogHistory.create({
      error_id: newError._id,
      app_id: app._id,
      previous_status: 'NONE',
      new_status: 'PENDING',
      resolution_notes: 'Initial crash captured from mobile app',
      action_type: 'STATUS_CHANGE'
    });

    res.status(201).json({ success: true, message: 'Crash reported successfully', error_id: newError._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== FEEDBACK ====================
const submitFeedback = async (req, res) => {
  try {
    const app = req.registeredApp;
    const { device_id, device_unique_Id, rating, feedback_text, user_email, app_version, device_info, os_version } = req.body;

    if (!rating || !feedback_text) {
      return res.status(400).json({ success: false, message: 'rating and feedback_text are required' });
    }

    const userDevice = device_unique_Id || device_id;
    let user = null;
    if (userDevice) {
      user = await User.findOne({ application_id: app._id, device_unique_Id: userDevice });
      if (!user) {
        user = await User.create({
          application_id: app._id,
          app_name: app.app_name,
          device_unique_Id: userDevice,
          Email_ID: user_email || '',
          app_version_no: app_version || '1.0.0',
          device_brand: device_info || '',
          device_os_version: os_version || '',
          first_installed_at: new Date(),
          last_active_at: new Date(),
          status: 'ACTIVE'
        });
      }
    }

    const feedback = await Feedback.create({
      user_id: user ? user._id : null,
      app_id: app._id,
      rating: Number(rating),
      feedback_text: feedback_text.trim(),
      user_email: user_email || (user ? user.Email_ID : ''),
      app_version: app_version || (user ? user.app_version_no : app.app_version),
      device_info: device_info || (user ? user.device_brand : ''),
      os_version: os_version || (user ? user.device_os_version : '')
    });

    res.status(201).json({ success: true, message: 'Thank you for your feedback!', feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CROSS MARKETING BANNERS ====================
const getActiveCrossBanners = async (req, res) => {
  try {
    const app = req.registeredApp;
    const banners = await CrossNotification.find({
      status: 'ACTIVE',
      $or: [
        { source_app_id: app._id },
        { target_group_id: app.group_id._id || app.group_id }
      ]
    }).populate('destination_app_id', 'app_name package_name app_icon store_url_android store_url_ios');

    res.json({ success: true, count: banners.length, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Track Cross Ad Impression / Click
const trackCrossAdInteraction = async (req, res) => {
  try {
    const { banner_id, interaction_type } = req.body; // interaction_type: 'IMPRESSION' | 'CLICK'
    const banner = await CrossNotification.findById(banner_id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (interaction_type === 'CLICK') {
      banner.clicks_count += 1;
    } else {
      banner.impressions_count += 1;
    }
    await banner.save();

    res.json({ success: true, impressions: banner.impressions_count, clicks: banner.clicks_count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  initApp,
  recordVisit,
  syncIap,
  submitCancelReason,
  reportCrash,
  submitFeedback,
  getActiveCrossBanners,
  trackCrossAdInteraction
};
