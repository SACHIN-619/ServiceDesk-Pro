import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
