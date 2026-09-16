import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER'), getAuditLogs);

export default router;
