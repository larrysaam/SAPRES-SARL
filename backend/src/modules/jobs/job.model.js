import mongoose from 'mongoose';
import { slugify } from '../../utils/slugify.js';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true
    },

    department: {
      type: String,
      required: true
    },

    employmentType: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true
    },

    salaryRange: String,

    experienceLevel: String,

    description: {
      type: String,
      required: true
    },

    requirements: [String],

    responsibilities: [String],

    benefits: [String],

    numberOfPositions: {
      type: Number,
      default: 1
    },

    applicationDeadline: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["draft", "open", "closed", "archived"],
      default: "draft"
    },

    featured: {
      type: Boolean,
      default: false
    },

    seoTitle: String,

    seoDescription: String,

    deletedAt: Date
  },
  {
    timestamps: true
  }
);

// Auto-generate slug from title before saving
jobSchema.pre('save', function (next) {
  if (!this.isModified('title')) return next();
  this.slug = slugify(this.title);
  next();
});

// Exclude soft-deleted jobs from queries
jobSchema.query.notDeleted = function () {
  return this.where({ deletedAt: { $exists: false } });
};

const Job = mongoose.model('Job', jobSchema);

export default Job;
