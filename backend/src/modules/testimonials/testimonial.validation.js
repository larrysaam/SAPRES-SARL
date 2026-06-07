
import Joi from "joi";
import { objectId } from "../../middlewares/validate.middleware.js";

const testimonialStatus = ["pending", "approved", "rejected"];

const createTestimonialSchema = Joi.object({
  clientName: Joi.string().min(3).max(100).trim().required(),
  clientTitle: Joi.string().min(3).max(100).trim().optional(),
  testimonialText: Joi.string().min(10).required(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  image: Joi.object({
    secure_url: Joi.string().uri().required(),
    public_id: Joi.string().required(),
  }).optional(),
  featured: Joi.boolean().default(false),
  status: Joi.string().valid(...testimonialStatus).default("pending"),
});

const updateTestimonialSchema = Joi.object({
  clientName: Joi.string().min(3).max(100).trim().optional(),
  clientTitle: Joi.string().min(3).max(100).trim().optional(),
  testimonialText: Joi.string().min(10).optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  image: Joi.object({
    secure_url: Joi.string().uri().required(),
    public_id: Joi.string().required(),
  }).optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string().valid(...testimonialStatus).optional(),
}).min(1);

const getTestimonialsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string().valid(...testimonialStatus).optional(),
  sortBy: Joi.string().optional(),
});

export default {
  createTestimonialSchema,
  updateTestimonialSchema,
  getTestimonialsSchema,
};
