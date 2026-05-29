import { Router } from 'express';
import {
  createRoom,
  getMyRooms,
  getRoomById,
  joinRoomByCode,
  updateRoom,
  archiveRoom,
  leaveRoom,
} from '../controllers/room.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/',           createRoom);
router.get('/',            getMyRooms);
router.get('/:id',         getRoomById);
router.post('/join',       joinRoomByCode);
router.patch('/:id',       updateRoom);
router.patch('/:id/archive', archiveRoom);
router.delete('/:id/leave',  leaveRoom);

export default router;