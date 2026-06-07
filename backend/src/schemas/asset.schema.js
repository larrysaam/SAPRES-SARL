import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
    },
    secureUrl: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
    },
    format: {
      type: String,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    bytes: {
      type: Number,
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw'],
      default: 'image',
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

export { assetSchema };
