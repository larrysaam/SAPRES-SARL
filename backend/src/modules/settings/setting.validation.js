import Joi from 'joi';

const workingHoursSchema = Joi.object({
  monday: Joi.string().allow('').optional(),
  tuesday: Joi.string().allow('').optional(),
  wednesday: Joi.string().allow('').optional(),
  thursday: Joi.string().allow('').optional(),
  friday: Joi.string().allow('').optional(),
  saturday: Joi.string().allow('').optional(),
  sunday: Joi.string().allow('').optional(),
}).optional();

const socialLinksSchema = Joi.object({
  facebook: Joi.string().uri().allow('').optional(),
  instagram: Joi.string().uri().allow('').optional(),
  linkedin: Joi.string().uri().allow('').optional(),
  youtube: Joi.string().uri().allow('').optional(),
  twitter: Joi.string().uri().allow('').optional(),
  tiktok: Joi.string().uri().allow('').optional(),
}).optional();

const updateSettingsSchema = Joi.object({
  companyName: Joi.string().trim().optional(),
  companyDescription: Joi.string().trim().optional(),
  email: Joi.string().email().trim().lowercase().optional(),
  phone: Joi.string().trim().optional(),
  secondaryPhone: Joi.string().trim().allow('').optional(),
  whatsapp: Joi.string().trim().allow('').optional(),
  address: Joi.string().trim().optional(),
  googleMapsUrl: Joi.string().uri().trim().allow('').optional(),
  workingHours: workingHoursSchema,
  socialLinks: socialLinksSchema,
  seoDefaultTitle: Joi.string().trim().allow('').optional(),
  seoDefaultDescription: Joi.string().trim().allow('').optional(),
  seoKeywords: Joi.array().items(Joi.string().trim()).optional(),
});

const uploadLogoSchema = Joi.object({
  logo: Joi.any()
    .meta({ swaggerType: 'file' })
    .required()
    .description('Logo file (png, jpg, jpeg, svg, webp, max 5MB)'),
});

const uploadFaviconSchema = Joi.object({
  favicon: Joi.any()
    .meta({ swaggerType: 'file' })
    .required()
    .description('Favicon file (ico, png, jpg, jpeg, svg, webp, max 5MB)'),
});

export default {
  updateSettingsSchema,
  uploadLogoSchema,
  uploadFaviconSchema,
};
