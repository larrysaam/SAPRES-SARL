import mongoose from 'mongoose';
import slugify from '../../utils/slugify.js';

const imageSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
  },
  secureUrl: {
    type: String,
    required: true,
  },
});

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
  },
  location: {
    type: String,
  },
});

const testimonialSchema = new mongoose.Schema({
  clientName: {
    type: String,
  },
  position: {
    type: String,
  },
  message: {
    type: String,
  },
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    client: clientSchema,
    projectCategory: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
    },
    projectType: {
      type: String,
      trim: true,
    },
    capacity: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    completionDate: {
      type: Date,
    },
    featuredImage: imageSchema,
    gallery: [imageSchema],
    beforeImages: [imageSchema],
    afterImages: [imageSchema],
    technologiesUsed: [String],
    projectChallenges: [String],
    projectSolutions: [String],
    projectResults: [String],
    testimonial: testimonialSchema,
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to generate slug from title before saving
projectSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title);
  }
  next();
});

// Soft delete method
projectSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

// Query middleware to exclude soft-deleted documents by default
projectSchema.pre(/^find/, function (next) {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);

export default Project;