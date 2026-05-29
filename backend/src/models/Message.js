import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  roomId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  senderId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:          { type: String, enum: ['text', 'system', 'attachment'], default: 'text' },
  text:          String,
  attachmentUrl: String,
  replyTo:       { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions:     [{ emoji: String, userId: mongoose.Schema.Types.ObjectId }],
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ roomId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);