import mongoose from 'mongoose';

const knowledgeArticleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, default: 'General' },
  problem: { type: String, required: true },
  symptoms: { type: String, default: '' },
  solution: { type: String, required: true },
  tags: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views: { type: Number, default: 0 },
  helpfulVotes: { type: Number, default: 0 },
  published: { type: Boolean, default: true }
}, { timestamps: true });

knowledgeArticleSchema.index({ title: 'text', problem: 'text', symptoms: 'text', solution: 'text', tags: 'text' });

export default mongoose.model('KnowledgeArticle', knowledgeArticleSchema);
