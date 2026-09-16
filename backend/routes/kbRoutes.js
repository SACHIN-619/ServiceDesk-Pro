import express from 'express';
import { getArticles, getArticleById, createArticle, voteHelpful } from '../controllers/kbController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getArticles)
  .post(protect, authorize('ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER', 'TECHNICIAN'), createArticle);

router.get('/:id', protect, getArticleById);
router.post('/:id/vote', protect, voteHelpful);

export default router;
