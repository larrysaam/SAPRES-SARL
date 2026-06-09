import Joi from 'joi';
import { objectId } from '../../utils/customValidation.js';

const categoryStatus = ['active', 'inactive'];

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  description: Joi.string().max(5000).trim().optional().default(''),
  shortDescription: Joi.string().max(250).trim().optional().default(''),
  featured: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...categoryStatus)
    .optional(),
  seoTitle: Joi.string().max(70).trim().optional(),
  seoDescription: Joi.string().max(160).trim().optional(),
  seoKeywords: Joi.array().items(Joi.string().trim()).max(20).optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().optional(),
  description: Joi.string().max(5000).trim().optional(),
  shortDescription: Joi.string().max(250).trim().optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...categoryStatus)
    .optional(),
  seoTitle: Joi.string().max(70).trim().optional(),
  seoDescription: Joi.string().max(160).trim().optional(),
  seoKeywords: Joi.array().items(Joi.string().trim()).max(20).optional(),
}).min(1);

const getCategoriesSchema = Joi.object({
  featured: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...categoryStatus)
    .optional(),
  search: Joi.string().trim().optional(),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
});

const uploadCategoryImageSchema = Joi.object({
  image: Joi.object({
    secure_url: Joi.string().uri().required(),
    public_id: Joi.string().required(),
  }).required(),
});

const uploadCategoryIconSchema = Joi.object({
  fileBase64: Joi.string().base64().required().messages({
    'string.base64': 'Icon file must be a valid base64 string',
    'any.required': 'Icon file (base64) is required',
  }),
  originalName: Joi.string().required().messages({
    'any.required': 'Original icon file name is required',
  }),
});

export default {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
  uploadCategoryImageSchema,
  uploadCategoryIconSchema,
};
