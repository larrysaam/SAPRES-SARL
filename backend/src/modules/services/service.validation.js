import Joi from 'joi';

// Joi schema for image objects
const imageSchema = Joi.object({
  publicId: Joi.string().required(),
  secureUrl: Joi.string().uri().required(),
  format: Joi.string().optional(),
  bytes: Joi.number().integer().optional(),
});

// Joi schema for service process steps
const serviceProcessStepSchema = Joi.object({
  step: Joi.number().integer().min(1).required(),
  title: Joi.string().required().min(3).max(255),
  description: Joi.string().optional().allow(''),
});

// Joi schema for creating a new service
const createServiceSchema = Joi.object({
  title: Joi.string().required().min(3).max(255),
  shortDescription: Joi.string().required().min(10).max(500),
  description: Joi.string().required().min(20),
  featuredImage: imageSchema.optional(),
  gallery: Joi.array().items(imageSchema).optional(),
  serviceFeatures: Joi.array().items(Joi.string()).optional(),
  serviceBenefits: Joi.array().items(Joi.string()).optional(),
  serviceProcess: Joi.array().items(serviceProcessStepSchema).optional(),
  targetAudience: Joi.array().items(Joi.string()).optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
  seoTitle: Joi.string().optional().allow(''),
  seoDescription: Joi.string().optional().allow(''),
  // createdBy will be set by the server
});

// Joi schema for updating an existing service
const updateServiceSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  shortDescription: Joi.string().min(10).max(500).optional(),
  description: Joi.string().min(20).optional(),
  featuredImage: imageSchema.optional(),
  gallery: Joi.array().items(imageSchema).optional(),
  serviceFeatures: Joi.array().items(Joi.string()).optional(),
  serviceBenefits: Joi.array().items(Joi.string()).optional(),
  serviceProcess: Joi.array().items(serviceProcessStepSchema).optional(),
  targetAudience: Joi.array().items(Joi.string()).optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
  seoTitle: Joi.string().optional().allow(''),
  seoDescription: Joi.string().optional().allow(''),
});

// Joi schema for reordering services
const reorderServicesSchema = Joi.object({
  services: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      displayOrder: Joi.number().integer().min(0).required(),
    })
  ).required(),
});

export {
  createServiceSchema,
  updateServiceSchema,
  reorderServicesSchema,
};
