import mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema({
  roomId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  savedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl:     { type: String, required: true },
  imageFormat:  { type: String, default: 'png' },
  strokeIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stroke' }],
  strokeCount:  Number,
  canvasWidth:  Number,
  canvasHeight: Number,
  pdfUrl:       String,
  exportedAt:   Date,
  label:        String,
}, { timestamps: true });

snapshotSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model('CanvasSnapshot', snapshotSchema);