const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Admin = require('../models/Admin');
const Group = require('../models/Group');
const App = require('../models/App');
const User = require('../models/User');
const UserVisitHistory = require('../models/UserVisitHistory');
const InAppPurchase = require('../models/InAppPurchase');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const CancelSubscriptionReason = require('../models/CancelSubscriptionReason');
const ErrorLog = require('../models/ErrorLog');
const ErrorLogHistory = require('../models/ErrorLogHistory');
const Feedback = require('../models/Feedback');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/app_junction_db';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for seeding');

    // 1. Seed Super Admin
    const existingAdmin = await Admin.findOne({ email: 'admin@appjunction.com' });
    let adminId;
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('Admin@123456', salt);
      const admin = await Admin.create({
        name: 'Super Admin',
        email: 'admin@appjunction.com',
        password_hash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      });
      adminId = admin._id;
      console.log('[Seed] Super Admin created: admin@appjunction.com / Admin@123456');
    } else {
      adminId = existingAdmin._id;
      console.log('[Seed] Super Admin already exists: admin@appjunction.com');
    }

    // 3. Seed Sample Groups
    let loveGroup = await Group.findOne({ group_name: 'Love & Relationship Apps' });
    if (!loveGroup) {
      loveGroup = await Group.create({
        group_name: 'Love & Relationship Apps',
        description: 'Applications focused on romance, compatibility, relationship quizzes, and quotes',
        color_code: '#EC4899',
        status: 'ACTIVE'
      });
    }

    let utilityGroup = await Group.findOne({ group_name: 'Productivity & Utilities' });
    if (!utilityGroup) {
      utilityGroup = await Group.create({
        group_name: 'Productivity & Utilities',
        description: 'Everyday utility apps, organizers, notes and vaults',
        color_code: '#3B82F6',
        status: 'ACTIVE'
      });
    }
    console.log('[Seed] Sample groups seeded');

    // 4. Seed Sample Apps
    let app1 = await App.findOne({ package_name: 'com.appjunction.lovecalc' });
    if (!app1) {
      app1 = await App.create({
        app_name: 'Love Calculator Pro',
        package_name: 'com.appjunction.lovecalc',
        bundle_id: 'com.appjunction.lovecalc.ios',
        group_id: loveGroup._id,
        platform: 'BOTH',
        app_version: '2.1.0',
        store_url_android: 'https://play.google.com/store/apps/details?id=com.appjunction.lovecalc',
        status: 'ACTIVE'
      });
    }

    let app2 = await App.findOne({ package_name: 'com.appjunction.romanticquotes' });
    if (!app2) {
      app2 = await App.create({
        app_name: 'Romantic Love Quotes & Poetry',
        package_name: 'com.appjunction.romanticquotes',
        bundle_id: 'com.appjunction.romanticquotes.ios',
        group_id: loveGroup._id,
        platform: 'ANDROID',
        app_version: '1.4.2',
        store_url_android: 'https://play.google.com/store/apps/details?id=com.appjunction.romanticquotes',
        status: 'ACTIVE'
      });
    }

    let app3 = await App.findOne({ package_name: 'com.appjunction.vaultpro' });
    if (!app3) {
      app3 = await App.create({
        app_name: 'Smart File Manager & Vault',
        package_name: 'com.appjunction.vaultpro',
        bundle_id: 'com.appjunction.vaultpro.ios',
        group_id: utilityGroup._id,
        platform: 'ANDROID',
        app_version: '3.0.1',
        store_url_android: 'https://play.google.com/store/apps/details?id=com.appjunction.vaultpro',
        status: 'ACTIVE'
      });
    }
    console.log('[Seed] Sample apps seeded');

    // 5. Seed Users & Data if User table is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Seed] Seeding sample users, subscriptions, crashes, and analytics...');

      const sampleCountries = [
        { country: 'India', code: 'IN', tz: 'Asia/Kolkata' },
        { country: 'United States', code: 'US', tz: 'America/New_York' },
        { country: 'United Kingdom', code: 'GB', tz: 'Europe/London' },
        { country: 'Germany', code: 'DE', tz: 'Europe/Berlin' },
        { country: 'Canada', code: 'CA', tz: 'America/Toronto' }
      ];

      const apps = [app1, app2, app3];

      for (let i = 1; i <= 25; i++) {
        const targetApp = apps[i % apps.length];
        const countryInfo = sampleCountries[i % sampleCountries.length];
        const isIos = i % 3 === 0;

        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - (i % 14));

        const user = await User.create({
          device_id: `device_sim_${i}_${targetApp.package_name}`,
          app_id: targetApp._id,
          fcm_token: `fcm_sample_token_${i}_${Date.now()}`,
          os_type: isIos ? 'IOS' : 'ANDROID',
          os_version: isIos ? 'iOS 17.4' : 'Android 14',
          device_model: isIos ? 'iPhone 15 Pro' : 'Samsung Galaxy S24',
          country: countryInfo.country,
          country_code: countryInfo.code,
          timezone: countryInfo.tz,
          app_version: targetApp.app_version,
          first_installed_at: createdDate,
          last_active_at: new Date(),
          status: 'ACTIVE'
        });

        // Add 2-4 visits for repeat customer simulation
        const visits = (i % 3) + 1;
        for (let v = 0; v < visits; v++) {
          await UserVisitHistory.create({
            user_id: user._id,
            app_id: targetApp._id,
            device_id: user.device_id,
            visit_date: createdDate,
            session_duration_seconds: 45 + (i * 15),
            country: user.country
          });
        }

        // Add In-App Purchases for some users
        if (i % 2 === 0) {
          const isSub = i % 4 !== 0;
          const amount = isSub ? 9.99 : 2.99;
          const iap = await InAppPurchase.create({
            user_id: user._id,
            app_id: targetApp._id,
            purchase_token: `token_sample_${i}_${Date.now()}`,
            transaction_id: `GPA.${1000 + i}-${2000 + i}`,
            product_id: isSub ? 'pro_monthly_vip' : 'consumable_pack_50',
            plan_name: isSub ? 'Pro VIP Monthly' : '50 Heart Gems',
            plan_type: isSub ? 'SUBSCRIPTION' : 'CONSUMABLE',
            amount,
            currency: 'USD',
            purchase_date: createdDate,
            expiry_date: isSub ? new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null,
            auto_renewing: isSub,
            country: user.country,
            os_type: user.os_type,
            status: i % 8 === 0 ? 'CANCELLED' : 'ACTIVE'
          });

          await SubscriptionHistory.create({
            user_id: user._id,
            app_id: targetApp._id,
            inapppurchase_id: iap._id,
            transaction_id: iap.transaction_id,
            event_type: 'INITIAL_PURCHASE',
            amount,
            currency: 'USD',
            event_date: createdDate
          });

          // If cancelled, seed cancellation feedback
          if (iap.status === 'CANCELLED') {
            await CancelSubscriptionReason.create({
              user_id: user._id,
              app_id: targetApp._id,
              inapppurchase_id: iap._id,
              reason_text: 'Subscription is too expensive',
              custom_feedback: 'Looking for a student discount or annual deal.',
              plan_name: iap.plan_name,
              total_spent: iap.amount,
              cancelled_at: new Date()
            });
          }
        }
      }

      // Seed 2 sample crashes
      const crash1 = await ErrorLog.create({
        app_id: app1._id,
        error_hash: 'hash_null_pointer_name_calc',
        error_title: 'NullPointerException in LoveCalculatorActivity',
        error_message: "Attempt to invoke virtual method 'java.lang.String.trim()' on a null object reference",
        stack_trace: 'at com.appjunction.lovecalc.LoveCalculatorActivity.calculateScore(LoveCalculatorActivity.java:84)\nat com.appjunction.lovecalc.LoveCalculatorActivity.onClick(LoveCalculatorActivity.java:112)',
        file_name: 'LoveCalculatorActivity.java',
        line_number: 84,
        os_type: 'ANDROID',
        severity: 'HIGH',
        status: 'PENDING',
        occurrences_count: 14,
        first_seen_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        last_seen_at: new Date()
      });

      await ErrorLogHistory.create({
        error_id: crash1._id,
        app_id: app1._id,
        previous_status: 'NONE',
        new_status: 'PENDING',
        resolution_notes: 'Initial crash report from Android devices',
        action_type: 'STATUS_CHANGE'
      });

      // Seed 3 sample feedbacks
      await Feedback.create({
        app_id: app1._id,
        rating: 5,
        feedback_text: 'Super accurate and romantic quotes, love the interface!',
        user_email: 'happy_user@gmail.com',
        status: 'NEW'
      });

      await Feedback.create({
        app_id: app2._id,
        rating: 4,
        feedback_text: 'Great daily poetry alerts, please add more romantic fonts.',
        status: 'REVIEWED'
      });

      console.log('[Seed] Analytics, crashes, and sample records seeded successfully!');
    }

    console.log('[Seed] All seeding completed successfully.');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error]', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

module.exports = seedData;

if (require.main === module) {
  seedData();
}
