import Joi from 'joi';
import { objectId } from '../../utils/customValidation.js';

const categoryStatus = ['active', 'inactive'];

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  description: Joi.string().max(5000).trim().required(),
  shortDescription: Joi.string().max(250).trim().required(),
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
}).min(1); // At least one field is required for update

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
  image: Joi.any()
    .meta({ swaggerType: 'file' })
    .required()
    .description('Category image file (jpg, jpeg, png, webp, max 5MB)'),
});

const uploadCategoryIconSchema = Joi.object({
  icon: Joi.any()
    .meta({ swaggerType: 'file' })
    .required()
    .description('Category icon file (jpg, jpeg, png, webp, max 5MB)'),
});

export default {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
  uploadCategoryImageSchema,
  uploadCategoryIconSchema,
};
