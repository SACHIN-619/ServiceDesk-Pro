import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.js';
import User from '../models/User.js';

async function fixRoles() {
  await connectDB();
  const res1 = await User.updateMany({ role: 'IT MANAGER' }, { $set: { role: 'IT_MANAGER' } });
  console.log('Fixed IT MANAGER -> IT_MANAGER:', res1.modifiedCount);

  const res2 = await User.updateMany({ role: 'ASSET MANAGER' }, { $set: { role: 'ASSET_MANAGER' } });
  console.log('Fixed ASSET MANAGER -> ASSET_MANAGER:', res2.modifiedCount);

  const res3 = await User.updateMany({ role: 'SYSTEM ADMIN' }, { $set: { role: 'ADMIN' } });
  console.log('Fixed SYSTEM ADMIN -> ADMIN:', res3.modifiedCount);

  const all = await User.find({}, 'name email role status');
  console.log('Current users:', JSON.stringify(all, null, 2));
  process.exit(0);
}

fixRoles().catch(err => {
  console.error(err);
  process.exit(1);
});
