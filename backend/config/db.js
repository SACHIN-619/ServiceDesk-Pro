import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows / local ISP DNS failing on SRV records (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}


const connectDB = async () => {
  let uri = (process.env.MONGO_URI || '').trim().replace(/^["']|["']$/g, '');
  
  // Clean up common copy-paste issues in Render/Vercel dashboards
  if (uri.startsWith('MONGO_URI=')) {
    uri = uri.replace(/^MONGO_URI=/, '').trim().replace(/^["']|["']$/g, '');
  }
  if (uri && !uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    if (uri.includes('mongodb.net') || uri.includes('@')) {
      uri = `mongodb+srv://${uri}`;
    }
  }

  if (!uri) {
    uri = 'mongodb://127.0.0.1:27017/serviceDesk';
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Warning on ${uri.split('@')[1] || uri}]: ${error.message}`);
    if (uri !== 'mongodb://127.0.0.1:27017/serviceDesk') {
      try {
        console.log('[MongoDB Fallback]: Attempting connection to local MongoDB at mongodb://127.0.0.1:27017/serviceDesk...');
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/serviceDesk', { serverSelectionTimeoutMS: 3000 });
        console.log(`[MongoDB Connected (Local Fallback)]: ${localConn.connection.host}`);
        return;
      } catch (localErr) {
        console.error(`[MongoDB Local Fallback Error]: ${localErr.message}`);
      }
    }
    console.log('[Notice]: Ensure MongoDB is running locally at mongodb://127.0.0.1:27017 or Atlas credentials are valid.');
  }
};

export default connectDB;
