const CrossNotification = require('../models/CrossNotification');
const App = require('../models/App');

// Create Cross Marketing Campaign / Poster
const createCrossCampaign = async (req, res) => {
  try {
    const {
      title,
      source_app_id,
      target_group_id,
      destination_app_id,
      custom_message,
      target_button_text,
      destination_store_url,
      start_date,
      end_date
    } = req.body;

    if (!title || !destination_app_id) {
      return res.status(400).json({
        success: false,
        message: 'title and destination_app_id are required'
      });
    }

    let poster_image_url = '';
    if (req.file) {
      poster_image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.poster_image_url) {
      poster_image_url = req.body.poster_image_url;
    }

    if (!poster_image_url) {
      return res.status(400).json({ success: false, message: 'Marketing poster image is required' });
    }

    // Lookup destination app store URL if not manually provided
    let finalStoreUrl = destination_store_url;
    if (!finalStoreUrl) {
      const destApp = await App.findById(destination_app_id);
      if (destApp) {
        finalStoreUrl = destApp.store_url_android || destApp.store_url_ios || '';
      }
    }

    const campaign = await CrossNotification.create({
      title,
      source_app_id: source_app_id || null,
      target_group_id: target_group_id || null,
      destination_app_id,
      poster_image_url,
      custom_message: custom_message || '',
      target_button_text: target_button_text || 'Install Now',
      destination_store_url: finalStoreUrl || '',
      start_date: start_date ? new Date(start_date) : new Date(),
      end_date: end_date ? new Date(end_date) : null,
      status: 'ACTIVE'
    });

    const populated = await CrossNotification.findById(campaign._id)
      .populate('source_app_id', 'app_name package_name app_icon')
      .populate('destination_app_id', 'app_name package_name app_icon store_url_android')
      .populate('target_group_id', 'group_name');

    res.status(201).json({
      success: true,
      message: 'Cross-marketing campaign poster created successfully',
      campaign: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Cross Marketing Campaigns with CTR stats
const getCrossCampaigns = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'ALL') query.status = status;

    const campaigns = await CrossNotification.find(query)
      .populate('source_app_id', 'app_name package_name app_icon')
      .populate('destination_app_id', 'app_name package_name app_icon store_url_android store_url_ios')
      .populate('target_group_id', 'group_name')
      .sort({ created_at: -1 })
      .lean();

    // Compute CTR for each
    const campaignsWithCtr = campaigns.map((c) => {
      const ctr = c.impressions_count > 0 ? ((c.clicks_count / c.impressions_count) * 100).toFixed(2) : 0;
      return { ...c, ctr_percent: parseFloat(ctr) };
    });

    res.json({ success: true, count: campaignsWithCtr.length, campaigns: campaignsWithCtr });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Campaign Status (Active / Paused)
const toggleCampaignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await CrossNotification.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    campaign.status = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await campaign.save();

    res.json({ success: true, message: `Campaign is now ${campaign.status}`, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Campaign
const deleteCrossCampaign = async (req, res) => {
  try {
    await CrossNotification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Cross-marketing campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCrossCampaign,
  getCrossCampaigns,
  toggleCampaignStatus,
  deleteCrossCampaign
};
