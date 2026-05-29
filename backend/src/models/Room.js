import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  inviteCode:      { type: String, required: true, unique: true },
  isPublic:        { type: Boolean, default: true },
  ownerId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxMembers:      { type: Number, default: 10 },
  canvasWidth:     { type: Number, default: 1920 },
  canvasHeight:    { type: Number, default: 1080 },
  backgroundColor: { type: String, default: '#ffffff' },
  gridEnabled:     { type: Boolean, default: true },
  snapshotId:      { type: mongoose.Schema.Types.ObjectId, ref: 'CanvasSnapshot' },
  isArchived:      { type: Boolean, default: false },
}, { timestamps: true });



export default mongoose.model('Room', roomSchema);
