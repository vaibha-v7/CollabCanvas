import { Router } from 'express';
import {
  createSnapshot,
  getSnapshotsByRoom,
  getLatestSnapshot,
  updateSnapshotPdf,
} from '../controllers/snapshot.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/',                          createSnapshot);
router.get('/room/:roomId',               getSnapshotsByRoom);
router.get('/room/:roomId/latest',        getLatestSnapshot);
router.patch('/:id/pdf',                  updateSnapshotPdf);

export default router;