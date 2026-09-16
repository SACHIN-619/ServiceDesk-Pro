import express from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  addComment,
  addWorkLog
} from '../controllers/ticketController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createTicket)
  .get(protect, getTickets);

router.route('/:id')
  .get(protect, getTicketById);

router.patch('/:id/status', protect, updateTicketStatus);
router.patch('/:id/assign', protect, authorize('ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER'), assignTicket);
router.post('/:id/comments', protect, addComment);
router.post('/:id/worklog', protect, authorize('ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER', 'TECHNICIAN'), addWorkLog);

export default router;
