import Joi from 'joi';
import { objectId } from '../../utils/customValidation.js';

const fileSchema = Joi.object({
  publicId: Joi.string().required(),
  secureUrl: Joi.string().required(),
  originalName: Joi.string().required(),
  format: Joi.string().required(),
  bytes: Joi.number().required(),
  resourceType: Joi.string().valid('image', 'raw').default('raw'),
});

const createApplication = Joi.object().keys({
  jobId: Joi.string().custom(objectId).required(),
  firstName: Joi.string().required().min(2).max(100),
  lastName: Joi.string().required().min(2).max(100),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  dateOfBirth: Joi.date().required(),
  nationality: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  phone: Joi.string().required().min(5).max(20),
  secondaryPhone: Joi.string().min(5).max(20).allow(''),
  address: Joi.string().min(3).max(200).allow(''),
  city: Joi.string().min(2).max(100).allow(''),
  region: Joi.string().min(2).max(100).allow(''),
  highestEducation: Joi.string().min(2).max(100).allow(''),
  yearsOfExperience: Joi.number().min(0).max(50).default(0),
  currentEmployer: Joi.string().min(2).max(100).allow(''),
  currentPosition: Joi.string().min(2).max(100).allow(''),
  expectedSalary: Joi.number().min(0).max(100000000).allow(0),
  coverLetter: Joi.string().min(10).max(5000).allow(''),
  skills: Joi.array().items(Joi.string().min(2).max(50)).optional(),
  languages: Joi.array().items(Joi.string().min(2).max(50)).optional(),
  // Files are handled by multer, so their validation will be in the service/controller
  // passportPhoto: fileSchema,
  // cv: fileSchema,
  // idCard: fileSchema,
  // diploma: fileSchema,
  // additionalDocuments: Joi.array().items(fileSchema),
});

const getApplications = Joi.object().keys({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(
    'pending',
    'under_review',
    'shortlisted',
    'interview_scheduled',
    'interviewed',
    'selected',
    'rejected',
    'withdrawn'
  ),
  jobId: Joi.string().custom(objectId),
  search: Joi.string().allow(''),
  sort: Joi.string().valid('createdAt', 'firstName', 'lastName', 'status'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

const getApplication = Joi.object().keys({
  applicationId: Joi.string().custom(objectId).required(),
});

const updateApplicationStatus = Joi.object().keys({
  applicationId: Joi.string().custom(objectId).required(),
  status: Joi.string().valid(
    'pending',
    'under_review',
    'shortlisted',
    'interview_scheduled',
    'interviewed',
    'selected',
    'rejected',
    'withdrawn'
  ).required(),
  reviewNotes: Joi.string().max(1000).allow(''),
});

const deleteApplication = Joi.object().keys({
  applicationId: Joi.string().custom(objectId).required(),
});

const downloadDocument = Joi.object().keys({
  applicationId: Joi.string().custom(objectId).required(),
});

export default {
  createApplication,
  getApplications,
  getApplication,
  updateApplicationStatus,
  deleteApplication,
  downloadDocument,
};
