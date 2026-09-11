const mongoose = require('mongoose');
const User = require('../models/User');
const UserVisitHistory = require('../models/UserVisitHistory');
const InAppPurchase = require('../models/InAppPurchase');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const CancelSubscriptionReason = require('../models/CancelSubscriptionReason');
const ErrorLog = require('../models/ErrorLog');
const App = require('../models/App');

// Helper to construct match filters for User / UserVisitHistory
const buildUserFilters = (query) => {
  const match = {};

  if (query.app_id && mongoose.Types.ObjectId.isValid(query.app_id)) {
    match.application_id = new mongoose.Types.ObjectId(query.app_id);
  }

  if (query.country && query.country !== 'ALL') {
    match.country = query.country;
  }

  if (query.os_type && query.os_type !== 'ALL') {
    match.device_OsType = new RegExp(`^${query.os_type}$`, 'i');
  }

  return match;
};

// Helper to construct match filters for IAP / ErrorLogs
const buildFilters = (query) => {
  const match = {};

  if (query.app_id && mongoose.Types.ObjectId.isValid(query.app_id)) {
    match.app_id = new mongoose.Types.ObjectId(query.app_id);
  }

  if (query.country && query.country !== 'ALL') {
    match.country = query.country;
  }

  if (query.os_type && query.os_type !== 'ALL') {
    match.os_type = query.os_type;
  }

  return match;
};

// ==================== DASHBOARD OVERVIEW ====================
const getDashboardOverview = async (req, res) => {
  try {
    const userFilters = buildUserFilters(req.query);
    const filters = buildFilters(req.query);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    // 1. Total & Today New Installs
    const totalInstalls = await User.countDocuments(userFilters);
    const todayInstalls = await User.countDocuments({
      ...userFilters,
      first_installed_at: { $gte: startOfToday }
    });

    // 2. Repeat Customers (Users with visit_count > 1)
    const repeatCustomers = await User.countDocuments({
      ...userFilters,
      visit_count: { $gt: 1 }
    });

    // 3. Today's Total Revenue
    const todayRevenuePipeline = [
      {
        $match: {
          ...filters,
          purchase_date: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          subscriptionTotal: {
            $sum: { $cond: [{ $eq: ['$plan_type', 'SUBSCRIPTION'] }, '$amount', 0] }
          },
          consumableTotal: {
            $sum: { $cond: [{ $eq: ['$plan_type', 'CONSUMABLE'] }, '$amount', 0] }
          }
        }
      }
    ];
    const todayRevenueResult = await InAppPurchase.aggregate(todayRevenuePipeline);
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;
    const todaySubRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].subscriptionTotal : 0;
    const todayConsumableRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].consumableTotal : 0;

    // 4. Overall Revenue & Active Subscriptions
    const activeSubscriptions = await InAppPurchase.countDocuments({
      ...filters,
      plan_type: 'SUBSCRIPTION',
      status: 'ACTIVE'
    });

    const allTimeRevenueResult = await InAppPurchase.aggregate([
      { $match: filters },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const allTimeRevenue = allTimeRevenueResult.length > 0 ? allTimeRevenueResult[0].total : 0;

    // 5. Total Unresolved Bug Crashes
    const pendingCrashes = await ErrorLog.countDocuments({
      ...(filters.app_id ? { app_id: filters.app_id } : {}),
      status: { $in: ['PENDING', 'REOPENED'] }
    });

    res.json({
      success: true,
      data: {
        total_installs: totalInstalls,
        today_installs: todayInstalls,
        repeat_customers: repeatCustomers,
        today_revenue: todayRevenue,
        today_subscription_revenue: todaySubRevenue,
        today_consumable_revenue: todayConsumableRevenue,
        active_subscriptions: activeSubscriptions,
        all_time_revenue: allTimeRevenue,
        pending_crashes: pendingCrashes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DATE-WISE REVENUE & TRENDS ====================
const getRevenueAnalytics = async (req, res) => {
  try {
    const filters = buildFilters(req.query);

    // Date Filtering for InAppPurchase
    const iapDateFilter = {};
    if (req.query.startDate || req.query.endDate) {
      iapDateFilter.purchase_date = {};
      if (req.query.startDate) iapDateFilter.purchase_date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        iapDateFilter.purchase_date.$lte = end;
      }
    } else {
      const days = parseInt(req.query.days) || 30;
      const sDate = new Date();
      sDate.setDate(sDate.getDate() - days);
      sDate.setHours(0, 0, 0, 0);
      iapDateFilter.purchase_date = { $gte: sDate };
    }

    const revenueTrends = await InAppPurchase.aggregate([
      {
        $match: {
          ...filters,
          ...iapDateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$purchase_date' }
          },
          total_revenue: { $sum: '$amount' },
          subscription_revenue: {
            $sum: { $cond: [{ $eq: ['$plan_type', 'SUBSCRIPTION'] }, '$amount', 0] }
          },
          consumable_revenue: {
            $sum: { $cond: [{ $eq: ['$plan_type', 'CONSUMABLE'] }, '$amount', 0] }
          },
          purchase_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Breakdown by App
    const appBreakdown = await InAppPurchase.aggregate([
      {
        $match: {
          ...filters,
          ...iapDateFilter
        }
      },
      {
        $group: {
          _id: '$app_id',
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'tbl_app',
          localField: '_id',
          foreignField: '_id',
          as: 'app'
        }
      },
      { $unwind: '$app' },
      {
        $project: {
          app_id: '$_id',
          app_name: '$app.app_name',
          package_name: '$app.package_name',
          revenue: 1,
          transactions: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Renewal Breakdown (New vs Auto-Renewals vs Repeats)
    const histDateFilter = {};
    if (req.query.startDate || req.query.endDate) {
      histDateFilter.event_date = {};
      if (req.query.startDate) histDateFilter.event_date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        histDateFilter.event_date.$lte = end;
      }
    } else {
      const days = parseInt(req.query.days) || 30;
      const sDate = new Date();
      sDate.setDate(sDate.getDate() - days);
      sDate.setHours(0, 0, 0, 0);
      histDateFilter.event_date = { $gte: sDate };
    }

    const renewalStats = await SubscriptionHistory.aggregate([
      {
        $match: {
          ...(filters.app_id ? { app_id: filters.app_id } : {}),
          ...histDateFilter
        }
      },
      {
        $group: {
          _id: '$event_type',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      trends: revenueTrends,
      app_breakdown: appBreakdown,
      renewal_stats: renewalStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CANCELLATION ANALYSIS ====================
const getCancellationAnalytics = async (req, res) => {
  try {
    const filters = {};
    if (req.query.app_id && mongoose.Types.ObjectId.isValid(req.query.app_id)) {
      filters.app_id = new mongoose.Types.ObjectId(req.query.app_id);
    }

    if (req.query.startDate || req.query.endDate) {
      filters.created_at = {};
      if (req.query.startDate) filters.created_at.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filters.created_at.$lte = end;
      }
    }

    const totalActive = await InAppPurchase.countDocuments({
      ...filters,
      plan_type: 'SUBSCRIPTION',
      status: 'ACTIVE'
    });

    const totalCancelled = await InAppPurchase.countDocuments({
      ...filters,
      plan_type: 'SUBSCRIPTION',
      status: 'CANCELLED'
    });

    const totalReasonDocs = await CancelSubscriptionReason.aggregate([
      { $match: filters },
      { $group: { _id: null, total: { $sum: '$total_cancellations' } } }
    ]);
    const cancelReasonCount = totalReasonDocs.length > 0 ? totalReasonDocs[0].total : 0;
    const effectiveCancelled = Math.max(totalCancelled, cancelReasonCount);

    const totalSubscribers = totalActive + effectiveCancelled;
    const churnRate = totalSubscribers > 0 ? ((effectiveCancelled / totalSubscribers) * 100).toFixed(2) : 0;

    // Reason-wise breakdown across all cancellation entries in array
    const reasonsBreakdown = await CancelSubscriptionReason.aggregate([
      { $match: filters },
      {
        $project: {
          all_reasons: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$cancellations', []] } }, 0] },
              then: '$cancellations.reason_text',
              else: ['$reason_text']
            }
          }
        }
      },
      { $unwind: '$all_reasons' },
      {
        $group: {
          _id: '$all_reasons',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Pagination for cancellations list
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalRecords = await CancelSubscriptionReason.countDocuments(filters);

    const cancellationsList = await CancelSubscriptionReason.find(filters)
      .populate('app_id', 'app_name package_name')
      .populate('user_id', 'device_unique_Id country os_type app_version_no')
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      active_subscriptions: totalActive,
      cancelled_subscriptions: effectiveCancelled,
      churn_rate_percent: parseFloat(churnRate),
      reasons_breakdown: reasonsBreakdown,
      recent_cancellations: cancellationsList,
      cancellations_list: cancellationsList,
      pagination: {
        total: totalRecords,
        page,
        pages: Math.ceil(totalRecords / limit) || 1,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PURCHASED SUBSCRIPTIONS LIST ====================
const getSubscriptionsList = async (req, res) => {
  try {
    const filters = {};
    if (req.query.app_id && mongoose.Types.ObjectId.isValid(req.query.app_id)) {
      filters.app_id = new mongoose.Types.ObjectId(req.query.app_id);
    }
    if (req.query.status && req.query.status !== 'ALL') {
      filters.status = req.query.status;
    }

    if (req.query.startDate || req.query.endDate) {
      filters.purchase_date = {};
      if (req.query.startDate) filters.purchase_date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filters.purchase_date.$lte = end;
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await InAppPurchase.countDocuments(filters);
    const subscriptions = await InAppPurchase.find(filters)
      .populate('app_id', 'app_name package_name')
      .populate('user_id', 'device_unique_Id country os_type app_version_no')
      .sort({ purchase_date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      subscriptions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== USERS & COUNTRY DISTRIBUTION ====================
const getUserDistribution = async (req, res) => {
  try {
    const filters = buildUserFilters(req.query);

    // Country-wise breakdown
    const countryDistribution = await User.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$country',
          country_code: { $first: '$country_code' },
          users_count: { $sum: 1 }
        }
      },
      { $sort: { users_count: -1 } },
      { $limit: 15 }
    ]);

    // OS breakdown
    const osDistribution = await User.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$device_OsType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      countries: countryDistribution,
      os: osDistribution
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardOverview,
  getRevenueAnalytics,
  getCancellationAnalytics,
  getSubscriptionsList,
  getUserDistribution
};
