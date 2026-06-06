const mongoose = require('mongoose');

// Schema for image attachments
const attachmentSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
  },
  secureUrl: {
    type: String,
    required: true,
  },
});

// Schema for customer details within a quote
const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address'],
  },
  location: {
    type: String,
    trim: true,
  },
});

// Schema for electricity consumption details
const electricityConsumptionSchema = new mongoose.Schema({
  monthlyBill: {
    type: Number,
  },
  usageDescription: {
    type: String,
    trim: true,
  },
});

// Schema for notes associated with a quote
const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User who added the note
    required: true,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // Automatically set the timestamp when a note is added
  },
});

// Main Quote Schema
const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      unique: true, // Ensure quote numbers are unique
      required: true,
      index: true,
    },
    customer: {
      type: customerSchema,
      required: true,
    },
    projectType: {
      type: String,
      trim: true,
    },
    propertyType: {
      type: String,
      trim: true,
    },
    budgetRange: {
      type: String,
      trim: true,
    },
    electricityConsumption: electricityConsumptionSchema,
    requirements: {
      type: String,
      trim: true,
    },
    attachments: [attachmentSchema], // Array of image attachments
    status: {
      type: String,
      enum: [
        'new',
        'under-review',
        'site-visit-required',
        'proposal-sent',
        'negotiation',
        'won',
        'lost',
      ], // Allowed statuses for a quote
      default: 'new', // Default status for new quote requests
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User (e.g., sales agent) assigned to this quote
      default: null,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    notes: [noteSchema], // Array of notes for lead management
    siteVisit: {
      visitDate: {
        type: Date,
      },
      visitTime: {
        type: String,
      },
      assignedEngineer: {
        type: String,
      },
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

// Method for soft deleting a quote
quoteSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

// Query middleware to exclude soft-deleted documents by default
quoteSchema.pre(/^find/, function (next) {
  // 'includeDeleted' option can be passed to explicitly include deleted documents
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// Create the Mongoose model for Quote
const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;