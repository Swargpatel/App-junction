const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');

// Get All Feedback with filters
const getFeedbackList = async (req, res) => {
  try {
    const { app_id, rating, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (app_id) query.app_id = app_id;
    if (rating) query.rating = Number(rating);
    if (status && status !== 'ALL') query.status = status;

    if (req.query.startDate || req.query.endDate) {
      query.created_at = {};
      if (req.query.startDate) query.created_at.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.created_at.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Feedback.countDocuments(query);

    const feedbacks = await Feedback.find(query)
      .populate('app_id', 'app_name package_name app_icon')
      .populate('user_id', 'device_id country')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Summary averages based on the matching query filters
    const matchStage = {};
    if (app_id) matchStage.app_id = new mongoose.Types.ObjectId(app_id);
    if (rating) matchStage.rating = Number(rating);
    if (status && status !== 'ALL') matchStage.status = status;
    if (query.created_at) matchStage.created_at = query.created_at;

    const avgResult = await Feedback.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);

    const averageRating = (total > 0 && avgResult.length > 0 && avgResult[0].totalReviews > 0)
      ? parseFloat(avgResult[0].avgRating.toFixed(1))
      : 0;

    res.json({
      success: true,
      total,
      average_rating: averageRating,
      page: parseInt(page),
      feedbacks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Feedback Status
const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    feedback.status = status;
    await feedback.save();

    res.json({ success: true, message: `Feedback marked as ${status}`, feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFeedbackList,
  updateFeedbackStatus
};
