import Joi from 'joi';

const imageSchema = Joi.object({
  publicId: Joi.string().required(),
  secureUrl: Joi.string().uri().required(),
}).unknown(true);

const clientSchema = Joi.object({
  name: Joi.string().required(),
  industry: Joi.string().optional().allow(''),
  location: Joi.string().optional().allow(''),
}).unknown(true);

const testimonialSchema = Joi.object({
  clientName: Joi.string().optional().allow(''),
  position: Joi.string().optional().allow(''),
  message: Joi.string().optional().allow(''),
});

const createProjectSchema = Joi.object({
  title: Joi.string().required().min(3).max(255),
  shortDescription: Joi.string().required().min(10).max(500),
  description: Joi.string().required().min(20),
  client: clientSchema.optional(),
  projectCategory: Joi.string().required().min(3).max(100),
  projectType: Joi.string().optional().allow(''),
  capacity: Joi.string().optional().allow(''),
  duration: Joi.string().optional().allow(''),
  completionDate: Joi.date().optional(),
  featuredImage: imageSchema.optional(),
  gallery: Joi.array().items(imageSchema).optional(),
  beforeImages: Joi.array().items(imageSchema).optional(),
  afterImages: Joi.array().items(imageSchema).optional(),
  technologiesUsed: Joi.array().items(Joi.string()).optional(),
  projectChallenges: Joi.array().items(Joi.string()).optional(),
  projectSolutions: Joi.array().items(Joi.string()).optional(),
  projectResults: Joi.array().items(Joi.string()).optional(),
  testimonial: testimonialSchema.optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
  seoTitle: Joi.string().optional().allow(''),
  seoDescription: Joi.string().optional().allow(''),
  // createdBy will be set by the server
}).unknown(true);

const updateProjectSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  shortDescription: Joi.string().min(10).max(500).optional(),
  description: Joi.string().min(20).optional(),
  client: clientSchema.optional(),
  projectCategory: Joi.string().min(3).max(100).optional(),
  projectType: Joi.string().optional().allow(''),
  capacity: Joi.string().optional().allow(''),
  duration: Joi.string().optional().allow(''),
  completionDate: Joi.date().optional(),
  featuredImage: imageSchema.optional(),
  gallery: Joi.array().items(imageSchema).optional(),
  beforeImages: Joi.array().items(imageSchema).optional(),
  afterImages: Joi.array().items(imageSchema).optional(),
  technologiesUsed: Joi.array().items(Joi.string()).optional(),
  projectChallenges: Joi.array().items(Joi.string()).optional(),
  projectSolutions: Joi.array().items(Joi.string()).optional(),
  projectResults: Joi.array().items(Joi.string()).optional(),
  testimonial: testimonialSchema.optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
  seoTitle: Joi.string().optional().allow(''),
  seoDescription: Joi.string().optional().allow(''),
}).unknown(true);

const reorderProjectsSchema = Joi.object({
  projects: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      displayOrder: Joi.number().integer().min(0).required(),
    })
  ).required(),
});

export {
  createProjectSchema,
  updateProjectSchema,
  reorderProjectsSchema,
};
