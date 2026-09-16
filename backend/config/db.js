import mongoose from 'mongoose';
import dns from 'node:dns';

// Fix for Windows DNS resolvers that fail on SRV queries for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom dns servers cannot be set
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/servicedesk_db';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error on ${uri.split('@')[1] || uri}]: ${error.message}`);
    if (uri !== 'mongodb://127.0.0.1:27017/servicedesk_db' && uri !== 'mongodb://127.0.0.1:27017/serviceDesk') {
      try {
        console.log('[MongoDB Fallback]: Attempting connection to local MongoDB at mongodb://127.0.0.1:27017/serviceDesk...');
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/serviceDesk');
        console.log(`[MongoDB Connected (Local Fallback)]: ${localConn.connection.host}`);
        return;
      } catch (localErr) {
        console.error(`[MongoDB Local Fallback Error]: ${localErr.message}`);
      }
    }
    console.log('[Notice]: Ensure MongoDB Atlas credentials are valid or local MongoDB is running at mongodb://127.0.0.1:27017');
  }
};

export default connectDB;
