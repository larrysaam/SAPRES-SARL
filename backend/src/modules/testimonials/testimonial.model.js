
import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientTitle: {
      type: String,
      trim: true,
    },
    testimonialText: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    image: {
      secure_url: String,
      public_id: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

testimonialSchema.query.notDeleted = function () {
  return this.where({ deletedAt: { $exists: false } });
};

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;
