const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/app_junction_db');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    // Auto-sync indexes for all registered models
    setTimeout(async () => {
      try {
        const User = require('../models/User');
        await User.syncIndexes();
      } catch (err) {
        // silent
      }
    }, 1000);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
