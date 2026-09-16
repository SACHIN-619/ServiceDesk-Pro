import express from 'express';
import {
  getUsers,
  getPendingUsers,
  getTechnicians,
  createUser,
  approveUser,
  rejectUser,
  updateUserProfile,
  updateUserByAdmin,
  deleteUser
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER', 'ASSET_MANAGER', 'TECHNICIAN'), getUsers);
router.get('/pending', authorize('ADMIN', 'SYSTEM_ADMIN'), getPendingUsers);
router.get('/technicians', getTechnicians);
router.post('/', authorize('ADMIN', 'SYSTEM_ADMIN'), createUser);

router.put('/profile', updateUserProfile);
router.put('/:id/approve', authorize('ADMIN', 'SYSTEM_ADMIN'), approveUser);
router.put('/:id/reject', authorize('ADMIN', 'SYSTEM_ADMIN'), rejectUser);
router.put('/:id', authorize('ADMIN', 'SYSTEM_ADMIN'), updateUserByAdmin);
router.delete('/:id', authorize('ADMIN', 'SYSTEM_ADMIN'), deleteUser);

export default router;
