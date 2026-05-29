import mongoose from 'mongoose';

const strokeSchema = new mongoose.Schema({
  roomId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tool:      { type: String, required: true, enum: ['pen','eraser','rect','circle','arrow','text','line'] },
  points:    [Number],
  color:     { type: String, required: true },
  width:     { type: Number, required: true },
  opacity:   { type: Number, required: true, default: 1 },
  shapeType: String,
  x: Number, y: Number, w: Number, h: Number,
  text: String, fontSize: Number,
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  socketId:  String,
}, { timestamps: true });

strokeSchema.index({ roomId: 1, createdAt: 1 });
strokeSchema.index({ roomId: 1, userId: 1 });

export default mongoose.model('Stroke', strokeSchema);