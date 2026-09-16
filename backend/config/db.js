import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/servicedesk_db');
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.log('[Notice]: Ensure MongoDB is running locally (mongodb://127.0.0.1:27017) or specify MONGO_URI in backend/.env');
  }
};

export default connectDB;
