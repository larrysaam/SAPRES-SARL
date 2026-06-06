const Joi = require('joi');
const { objectId } = require('../../middlewares/validate.middleware');

const productStatus = ['draft', 'published', 'archived'];
const productCurrency = ['XAF', 'USD', 'EUR'];

const specificationSchema = Joi.object({
  label: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
});

const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(200).trim().required(),
  shortDescription: Joi.string().max(500).trim().required(),
  description: Joi.string().required(),
  category: Joi.string().custom(objectId).required(),
  sku: Joi.string().trim().required(),
  brand: Joi.string().trim().required(),
  price: Joi.number().greater(0).required(),
  discountPrice: Joi.number().min(0).less(Joi.ref('price')).optional(),
  stock: Joi.number().min(0).required(),
  currency: Joi.string()
    .valid(...productCurrency)
    .optional(),
  warranty: Joi.string().trim().optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...productStatus)
    .optional(),
  specifications: Joi.array().items(specificationSchema).optional(),
  seoTitle: Joi.string().trim().optional(),
  seoDescription: Joi.string().trim().optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(200).trim().optional(),
  shortDescription: Joi.string().max(500).trim().optional(),
  description: Joi.string().optional(),
  category: Joi.string().custom(objectId).optional(),
  sku: Joi.string().trim().optional(),
  brand: Joi.string().trim().optional(),
  price: Joi.number().greater(0).optional(),
  discountPrice: Joi.number().min(0).less(Joi.ref('price')).optional(),
  stock: Joi.number().min(0).optional(),
  currency: Joi.string()
    .valid(...productCurrency)
    .optional(),
  warranty: Joi.string().trim().optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...productStatus)
    .optional(),
  specifications: Joi.array().items(specificationSchema).optional(),
  seoTitle: Joi.string().trim().optional(),
  seoDescription: Joi.string().trim().optional(),
}).min(1); // At least one field is required for update

const getProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  category: Joi.string().custom(objectId).optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...productStatus)
    .optional(),
  search: Joi.string().trim().optional(),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
});

const uploadProductImagesSchema = Joi.object({
  images: Joi.array()
    .items(Joi.any().meta({ swaggerType: 'file' }))
    .min(1)
    .max(10)
    .required()
    .description('Product image files (jpg, jpeg, png, webp, max 5MB each)'),
});

const uploadDatasheetSchema = Joi.object({
  datasheet: Joi.any()
    .meta({ swaggerType: 'file' })
    .required()
    .description('Product datasheet file (pdf, max 10MB)'),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
  uploadProductImagesSchema,
  uploadDatasheetSchema,
};