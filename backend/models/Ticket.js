import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, default: 'General' },
  category: { type: String, required: true, default: 'General IT' },
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED', 'REOPENED'],
    default: 'OPEN'
  },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
  
  responseDeadline: { type: Date },
  resolutionDeadline: { type: Date },
  respondedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
  slaResponseBreached: { type: Boolean, default: false },
  slaResolutionBreached: { type: Boolean, default: false },
  
  aiClassification: {
    category: { type: String },
    priority: { type: String },
    probableIssue: { type: String },
    confidence: { type: Number, default: 0.88 },
    suggestedKeywords: [{ type: String }]
  },

  attachments: [{
    name: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],

  workLogs: [{
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timeSpentMinutes: { type: Number, default: 15 },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],

  resolutionNotes: { type: String, default: '' },
  reopenReason: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);
