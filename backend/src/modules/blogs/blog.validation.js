const Joi = require('joi');

const createBlogSchema = Joi.object({
  title: Joi.string().required(),
  excerpt: Joi.string().required(),
  content: Joi.string().required(),
  category: Joi.string().valid(
    "Solar Guides",
    "Company News",
    "Energy Tips",
    "Product Updates",
    "Installation Tips",
    "Success Stories",
    "Industry News"
  ).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  featured: Joi.boolean().default(false),
  allowComments: Joi.boolean().default(false),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  seoTitle: Joi.string().required(),
  seoDescription: Joi.string().required(),
});

const updateBlogSchema = Joi.object({
  title: Joi.string().optional(),
  excerpt: Joi.string().optional(),
  content: Joi.string().optional(),
  category: Joi.string().valid(
    "Solar Guides",
    "Company News",
    "Energy Tips",
    "Product Updates",
    "Installation Tips",
    "Success Stories",
    "Industry News"
  ).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  featured: Joi.boolean().optional(),
  allowComments: Joi.boolean().optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  seoTitle: Joi.string().optional(),
  seoDescription: Joi.string().optional(),
});

module.exports = {
  createBlogSchema,
  updateBlogSchema,
};
