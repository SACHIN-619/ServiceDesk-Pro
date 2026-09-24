import mongoose from 'mongoose';


const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/serviceDesk';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
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
