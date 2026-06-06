import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true
    },
    secureUrl: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    format: {
      type: String,
      required: true
    },
    bytes: {
      type: Number,
      required: true
    },
    resourceType: {
      type: String,
      enum: ['image', 'raw'],
      default: 'raw'
    },
  },
  {
    timestamps: true
  }
);

export { assetSchema };
