import mongoose from 'mongoose';
import slugify from '../../utils/slugify.js'; // Utility to generate URL-friendly slugs

// Schema for image objects stored in Cloudinary
const imageSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
  },
  secureUrl: {
    type: String,
    required: true,
  },
  format: {
    type: String,
  },
  bytes: {
    type: Number,
  },
});

// Schema for service process steps
const serviceProcessStepSchema = new mongoose.Schema({
  step: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});

// Main Service Schema
const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      unique: true, // Ensure service titles are unique
      trim: true,
    },
    slug: {
      type: String,
      unique: true, // Ensure slugs are unique for clean URLs
      index: true, // Index for faster lookup by slug
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
    featuredImage: imageSchema, // Single featured image for the service
    gallery: [imageSchema], // Array of images for the service gallery
    serviceFeatures: [String], // List of features offered by the service
    serviceBenefits: [String], // List of benefits of the service
    serviceProcess: [serviceProcessStepSchema], // Detailed steps of the service process
    targetAudience: [String], // Target audience for the service
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'], // Allowed statuses for a service
      default: 'draft', // Default status for new services
    },
    featured: {
      type: Boolean,
      default: false, // Whether the service is featured (e.g., on homepage)
    },
    displayOrder: {
      type: Number,
      default: 0, // Order in which services are displayed
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
      ref: 'User', // Reference to the User who created the service
    },
    isDeleted: {
      type: Boolean,
      default: false, // Flag for soft deletion
    },
    deletedAt: {
      type: Date, // Timestamp for soft deletion
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Middleware to generate slug from title before saving
serviceSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title); // Generate slug from title
  }
  next();
});

// Method for soft deleting a service
serviceSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

// Query middleware to exclude soft-deleted documents by default
serviceSchema.pre(/^find/, function (next) {
  // 'includeDeleted' option can be passed to explicitly include deleted documents
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// Create the Mongoose model for Service
const Service = mongoose.model('Service', serviceSchema);

export default Service;