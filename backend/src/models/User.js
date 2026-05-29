import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username:      { type: String, required: true, unique: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  passwordHash:  { type: String, required: true },
  avatarUrl:     { type: String, default: '' },
  displayColor:  { type: String, required: true, default: '#534AB7' },
  roomsCreated:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  roomsJoined:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  lastActiveAt:  { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublic = function () {
  const { passwordHash, __v, ...rest } = this.toObject();
  return rest;
};

export default mongoose.model('User', userSchema);