
import Joi from 'joi';
import { objectId } from '../../middlewares/validate.middleware.js';

const jobStatus = ['draft', 'open', 'closed', 'archived'];
const employmentTypes = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];

const createJobSchema = Joi.object({
  title: Joi.string().min(3).max(200).trim().required(),
  department: Joi.string().trim().required(),
  employmentType: Joi.string().valid(...employmentTypes).required(),
  location: Joi.string().trim().required(),
  salaryRange: Joi.string().trim().optional(),
  experienceLevel: Joi.string().trim().optional(),
  description: Joi.string().required(),
  requirements: Joi.array().items(Joi.string().trim()).optional(),
  responsibilities: Joi.array().items(Joi.string().trim()).optional(),
  benefits: Joi.array().items(Joi.string().trim()).optional(),
  numberOfPositions: Joi.number().integer().min(1).default(1),
  applicationDeadline: Joi.date().required(),
  status: Joi.string().valid(...jobStatus).default('draft'),
  featured: Joi.boolean().default(false),
  seoTitle: Joi.string().trim().optional(),
  seoDescription: Joi.string().trim().optional(),
});

const updateJobSchema = Joi.object({
  title: Joi.string().min(3).max(200).trim().optional(),
  department: Joi.string().trim().optional(),
  employmentType: Joi.string().valid(...employmentTypes).optional(),
  location: Joi.string().trim().optional(),
  salaryRange: Joi.string().trim().optional(),
  experienceLevel: Joi.string().trim().optional(),
  description: Joi.string().optional(),
  requirements: Joi.array().items(Joi.string().trim()).optional(),
  responsibilities: Joi.array().items(Joi.string().trim()).optional(),
  benefits: Joi.array().items(Joi.string().trim()).optional(),
  numberOfPositions: Joi.number().integer().min(1).optional(),
  applicationDeadline: Joi.date().optional(),
  status: Joi.string().valid(...jobStatus).optional(),
  featured: Joi.boolean().optional(),
  seoTitle: Joi.string().trim().optional(),
  seoDescription: Joi.string().trim().optional(),
}).min(1);

const getJobsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  department: Joi.string().trim().optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string().valid(...jobStatus).optional(),
  search: Joi.string().trim().optional(),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
});

const updateJobStatusSchema = Joi.object({
  status: Joi.string().valid(...jobStatus).required(),
});

export default {
  createJobSchema,
  updateJobSchema,
  getJobsSchema,
  updateJobStatusSchema,
};
