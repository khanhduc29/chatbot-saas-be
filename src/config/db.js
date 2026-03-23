const mongoose = require('mongoose');

/**
 * Kết nối MongoDB với retry logic
 * Trên Render cần dùng MongoDB Atlas (cloud), không phải localhost
 */
const connectDB = async (retries = 5) => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment variables!');
    process.exit(1);
  }

  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i}/${retries} failed: ${error.message}`);
      if (i === retries) {
        console.error('💀 All retry attempts failed. Exiting...');
        console.error('💡 Hint: Make sure MONGODB_URI is a valid MongoDB Atlas connection string');
        console.error('   Example: mongodb+srv://user:pass@cluster.mongodb.net/chatbot-saas');
        process.exit(1);
      }
      console.log(`⏳ Retrying in 5 seconds...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
};

module.exports = connectDB;

