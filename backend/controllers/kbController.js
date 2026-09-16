import KnowledgeArticle from '../models/KnowledgeArticle.js';
import AuditLog from '../models/AuditLog.js';

export const getArticles = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { published: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { problem: { $regex: search, $options: 'i' } },
        { solution: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const articles = await KnowledgeArticle.find(query)
      .sort({ helpfulVotes: -1, createdAt: -1 })
      .populate('author', 'name role avatar');

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const article = await KnowledgeArticle.findById(req.params.id)
      .populate('author', 'name role avatar');

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    article.views += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createArticle = async (req, res) => {
  try {
    const { title, category, problem, symptoms, solution, tags } = req.body;

    const article = await KnowledgeArticle.create({
      title,
      category: category || 'General',
      problem,
      symptoms: symptoms || '',
      solution,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      author: req.user._id
    });

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'KB_ARTICLE_CREATED',
      target: `Article "${article.title}"`,
      details: `Published Knowledge Base solution article in category ${article.category}`
    });

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const voteHelpful = async (req, res) => {
  try {
    const article = await KnowledgeArticle.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    article.helpfulVotes += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
