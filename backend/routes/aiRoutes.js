import express from 'express';
import { classifyTicketHandler, recommendSolutionsHandler } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/classify', protect, classifyTicketHandler);
router.post('/recommend', protect, recommendSolutionsHandler);

export default router;
