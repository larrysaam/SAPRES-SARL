import mongoose from 'mongoose';
import { generateSequentialNumber } from '../../utils/generateSequentialNumber.js';

const fileSchema = new mongoose.Schema({
  publicId: { type: String, required: true },
  secureUrl: { type: String, required: true },
  originalName: { type: String, required: true },
  format: { type: String, required: true },
  bytes: { type: Number, required: true },
  resourceType: { type: String, enum: ['image', 'raw'], default: 'raw' },
});

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      unique: true,
      required: true,
    },
    job: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
      title: { type: String, required: true },
      department: { type: String },
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    secondaryPhone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    highestEducation: {
      type: String,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
    currentEmployer: {
      type: String,
      trim: true,
    },
    currentPosition: {
      type: String,
      trim: true,
    },
    expectedSalary: {
      type: Number,
      min: 0,
    },
    coverLetter: {
      type: String,
      trim: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    passportPhoto: { type: fileSchema },
    cv: { type: fileSchema },
    idCard: { type: fileSchema },
    diploma: { type: fileSchema },
    additionalDocuments: [fileSchema],
    status: {
      type: String,
      enum: [
        'pending',
        'under_review',
        'shortlisted',
        'interview_scheduled',
        'interviewed',
        'selected',
        'rejected',
        'withdrawn',
      ],
      default: 'pending',
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.pre('save', async function (next) {
  const application = this;
  if (application.isNew) {
    const currentYear = new Date().getFullYear();
    const prefix = `APP-${currentYear}-`;
    const lastApplication = await Application.findOne(
      { applicationNumber: new RegExp(`^${prefix}`) },
      {},
      { sort: { applicationNumber: -1 } }
    );
    let lastNumber = 0;
    if (lastApplication) {
      const lastAppNumber = lastApplication.applicationNumber;
      lastNumber = parseInt(lastAppNumber.substring(lastAppNumber.lastIndexOf('-') + 1));
    }
    application.applicationNumber = generateSequentialNumber(prefix, lastNumber, 5); // Using 5 for padding as per example APP-2026-00001
  }
  next();
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;