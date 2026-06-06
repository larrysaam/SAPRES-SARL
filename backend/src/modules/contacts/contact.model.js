import mongoose from 'mongoose';

// Schema for notes associated with a contact
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

// Main Contact Schema
const contactSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Please fill a valid email address'], // Basic email validation
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'closed'], // Allowed statuses for a contact request
      default: 'new', // Default status for new contact requests
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User (e.g., sales agent) assigned to this contact
      default: null,
    },
    notes: [noteSchema], // Array of notes for lead management
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

// Method for soft deleting a contact
contactSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

// Query middleware to exclude soft-deleted documents by default
contactSchema.pre(/^find/, function (next) {
  // 'includeDeleted' option can be passed to explicitly include deleted documents
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// Create the Mongoose model for Contact
const Contact = mongoose.model('Contact', contactSchema);

export default Contact;