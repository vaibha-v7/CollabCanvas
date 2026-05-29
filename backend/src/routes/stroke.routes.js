import { Router } from 'express';
import {
  getStrokesByRoom,
  createStroke,
  deleteStroke,
  clearRoomStrokes,
} from '../controllers/stroke.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/room/:roomId',        getStrokesByRoom);
router.post('/',                   createStroke);
router.delete('/:id',              deleteStroke);
router.delete('/room/:roomId/clear', clearRoomStrokes);

export default router;