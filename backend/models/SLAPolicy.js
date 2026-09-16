import mongoose from 'mongoose';

const slaPolicySchema = new mongoose.Schema({
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true,
    unique: true
  },
  responseSLAHours: { type: Number, required: true },
  resolutionSLAHours: { type: Number, required: true },
  description: { type: String, default: '' },
  escalationTarget: { type: String, default: 'IT Manager' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('SLAPolicy', slaPolicySchema);
