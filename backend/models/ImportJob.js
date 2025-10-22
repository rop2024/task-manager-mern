import mongoose from 'mongoose';

const importJobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  total: { type: Number, default: 0 },
  createdCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  errors: [{ index: Number, message: String }],
  meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model('ImportJob', importJobSchema);
