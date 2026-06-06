import Joi from 'joi';

const createJobSchema = Joi.object({
  title: Joi.string().required(),
  department: Joi.string().required(),
  employmentType: Joi.string().required(),
  location: Joi.string().required(),
  salaryRange: Joi.string().optional(),
  experienceLevel: Joi.string().optional(),
  description: Joi.string().required(),
  requirements: Joi.array().items(Joi.string()).optional(),
  responsibilities: Joi.array().items(Joi.string()).optional(),
  benefits: Joi.array().items(Joi.string()).optional(),
  numberOfPositions: Joi.number().default(1),
  applicationDeadline: Joi.date().required(),
  featured: Joi.boolean().default(false),
  status: Joi.string().valid('draft', 'open', 'closed', 'archived').default('draft'),
  seoTitle: Joi.string().optional(),
  seoDescription: Joi.string().optional(),
});

const updateJobSchema = Joi.object({
  title: Joi.string().optional(),
  department: Joi.string().optional(),
  employmentType: Joi.string().optional(),
  location: Joi.string().optional(),
  salaryRange: Joi.string().optional(),
  experienceLevel: Joi.string().optional(),
  description: Joi.string().optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  responsibilities: Joi.array().items(Joi.string()).optional(),
  benefits: Joi.array().items(Joi.string()).optional(),
  numberOfPositions: Joi.number().optional(),
  applicationDeadline: Joi.date().optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string().valid('draft', 'open', 'closed', 'archived').optional(),
  seoTitle: Joi.string().optional(),
  seoDescription: Joi.string().optional(),
});

export default {
  createJobSchema,
  updateJobSchema,
};
