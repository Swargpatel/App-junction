const { DateTime } = require('luxon');
const OwnNotification = require('../models/OwnNotification');
const Notification = require('../models/Notification');

// Function that inspects user timezones and delivers notifications when their local time arrives
const checkAndDispatchTimezoneNotifications = async () => {
  try {
    const queuedItems = await OwnNotification.find({ status: 'QUEUED' })
      .populate('notification_id')
      .limit(200);

    if (queuedItems.length === 0) return;

    let dispatchedCount = 0;

    for (const item of queuedItems) {
      if (!item.notification_id || item.notification_id.status !== 'SCHEDULED') {
        continue;
      }

      const userTimezone = item.user_timezone || 'UTC';
      const targetTimeStr = item.target_local_time || '20:00'; // e.g. "20:00" = 8:00 PM
      const [targetHour] = targetTimeStr.split(':').map(Number);

      // Calculate current hour in the user's country/timezone
      let userLocalTime;
      try {
        userLocalTime = DateTime.now().setZone(userTimezone);
      } catch (err) {
        userLocalTime = DateTime.now().setZone('UTC');
      }

      const currentLocalHour = userLocalTime.hour;

      // If user's local hour matches target hour (e.g., 20)
      if (currentLocalHour === targetHour) {
        // In production, trigger Firebase FCM notification here with item.fcm_token
        item.status = 'SENT';
        item.dispatched_at = new Date();
        await item.save();

        await Notification.findByIdAndUpdate(item.notification_id._id, {
          $inc: { total_sent: 1 }
        });

        dispatchedCount++;
      }
    }

    if (dispatchedCount > 0) {
      console.log(`[Timezone Worker] Successfully dispatched ${dispatchedCount} notification(s) at local user time`);
    }
  } catch (error) {
    console.error(`[Timezone Worker Error] ${error.message}`);
  }
};

const startTimezoneWorker = () => {
  console.log('[Timezone Worker] Initialized smart local timezone notification scheduler');
  // Run every 10 minutes
  setInterval(checkAndDispatchTimezoneNotifications, 10 * 60 * 1000);
  // Also run initial check on boot
  setTimeout(checkAndDispatchTimezoneNotifications, 5000);
};

module.exports = {
  startTimezoneWorker,
  checkAndDispatchTimezoneNotifications
};
