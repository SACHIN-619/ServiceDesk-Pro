import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'SLA_BREACH', 'ASSIGNMENT', 'STATUS_CHANGE', 'USER_REGISTRATION', 'COMMENT'],
    default: 'INFO'
  },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
