import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  assetTag: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['Laptop', 'Desktop', 'Monitor', 'Mobile', 'Server', 'Printer', 'Software License', 'Peripherals'],
    required: true
  },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  serialNumber: { type: String, required: true, unique: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  department: { type: String, default: 'IT' },
  purchaseDate: { type: Date, default: Date.now },
  warrantyExpiry: { type: Date },
  status: {
    type: String,
    enum: ['PROCURED', 'IN_STOCK', 'ASSIGNED', 'UNDER_REPAIR', 'REASSIGNED', 'RETIRED'],
    default: 'IN_STOCK'
  },
  specifications: { type: String, default: '' },
  cost: { type: Number, default: 0 },
  maintenanceHistory: [{
    date: { type: Date, default: Date.now },
    description: { type: String },
    cost: { type: Number, default: 0 },
    technician: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model('Asset', assetSchema);
