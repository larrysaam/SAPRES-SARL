const Joi = require('joi');

const statisticSchema = Joi.object({
  label: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
});

const featuredProductSchema = Joi.object({
  _id: Joi.string().hex().length(24).required(),
  name: Joi.string().trim().required(),
  slug: Joi.string().trim().required(),
  price: Joi.number().required(),
  discountPrice: Joi.number().optional(),
  image: Joi.object({
    publicId: Joi.string().required(),
    secureUrl: Joi.string().uri().required(),
  }).required(),
});

const featuredProjectSchema = Joi.object({
  _id: Joi.string().hex().length(24).required(),
  title: Joi.string().trim().required(),
  slug: Joi.string().trim().required(),
  location: Joi.string().trim().required(),
  coverImage: Joi.object({
    publicId: Joi.string().required(),
    secureUrl: Joi.string().uri().required(),
  }).required(),
});

const featuredServiceSchema = Joi.object({
  _id: Joi.string().hex().length(24).required(),
  title: Joi.string().trim().required(),
  slug: Joi.string().trim().required(),
});

const testimonialItemSchema = Joi.object({
  _id: Joi.string().hex().length(24).required(),
  name: Joi.string().trim().required(),
  testimonial: Joi.string().trim().required(),
});

const partnerItemSchema = Joi.object({
  name: Joi.string().trim().required(),
  website: Joi.string().uri().allow('').optional(),
  logo: Joi.object({
    publicId: Joi.string().required(),
    secureUrl: Joi.string().uri().required(),
  }).optional(),
});

const updateHomepageSchema = Joi.object({
  hero: Joi.object({
    title: Joi.string().trim().optional(),
    subtitle: Joi.string().trim().optional(),
    ctaText: Joi.string().trim().optional(),
    ctaLink: Joi.string().trim().optional(),
    backgroundImage: Joi.object({
      publicId: Joi.string().optional(),
      secureUrl: Joi.string().uri().optional(),
    }).optional(),
    backgroundVideo: Joi.object({
      publicId: Joi.string().optional(),
      secureUrl: Joi.string().uri().optional(),
    }).optional(),
  }).optional(),
  statistics: Joi.array().items(statisticSchema).optional(),
  aboutSection: Joi.object({
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
    image: Joi.object({
      publicId: Joi.string().optional(),
      secureUrl: Joi.string().uri().optional(),
    }).optional(),
  }).optional(),
  featuredProducts: Joi.array().items(featuredProductSchema).optional(),
  featuredProjects: Joi.array().items(featuredProjectSchema).optional(),
  featuredServices: Joi.array().items(featuredServiceSchema).optional(),
  testimonials: Joi.array().items(testimonialItemSchema).optional(),
  partners: Joi.array().items(partnerItemSchema).optional(),
});

const uploadHeroImageSchema = Joi.object({
  heroImage: Joi.any()
    .meta({ swaggerType: 'file' })
    .required()
    .description('Hero image file (png, jpg, jpeg, svg, webp, max 5MB)'),
});

const uploadHeroVideoSchema = Joi.object({
  heroVideo: Joi.any()
    .meta({ swaggerType: 'file' })
    .required()
    .description('Hero video file (mp4, mov, webm, max 100MB)'),
});

module.exports = {
  updateHomepageSchema,
  uploadHeroImageSchema,
  uploadHeroVideoSchema,
};