import express from 'express';
import { getSLAPolicies, updateSLAPolicy, triggerBreachCheck } from '../controllers/slaController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/policies', protect, getSLAPolicies);
router.put('/policies/:id', protect, authorize('ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER'), updateSLAPolicy);
router.post('/check-breaches', protect, authorize('ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER'), triggerBreachCheck);

export default router;
