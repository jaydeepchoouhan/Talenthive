const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video'], required: true },
    publicId: { type: String, default: '' }
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String, trim: true, default: '' },
    media: [mediaSchema],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sharesCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
