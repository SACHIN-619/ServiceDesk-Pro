import express from 'express';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  logAssetMaintenance
} from '../controllers/assetController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAssets)
  .post(protect, authorize('ADMIN', 'SYSTEM_ADMIN', 'ASSET_MANAGER', 'IT_MANAGER'), createAsset);

router.route('/:id')
  .get(protect, getAssetById)
  .put(protect, authorize('ADMIN', 'SYSTEM_ADMIN', 'ASSET_MANAGER', 'IT_MANAGER'), updateAsset);

router.post('/:id/maintenance', protect, authorize('ADMIN', 'SYSTEM_ADMIN', 'ASSET_MANAGER', 'TECHNICIAN'), logAssetMaintenance);

export default router;
