
import Testimonial from './testimonial.model.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';

const createTestimonial = async (testimonialBody) => {
  const testimonial = await Testimonial.create(testimonialBody);
  return testimonial;
};

const queryTestimonials = async (filter, options) => {
  const testimonials = await Testimonial.paginate(filter, options);
  return testimonials;
};

const getTestimonialById = async (id) => {
  const testimonial = await Testimonial.findById(id);
  return testimonial;
};

const updateTestimonialById = async (testimonialId, updateBody) => {
  const testimonial = await getTestimonialById(testimonialId);
  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  Object.assign(testimonial, updateBody);
  await testimonial.save();
  return testimonial;
};

const deleteTestimonialById = async (testimonialId) => {
  const testimonial = await getTestimonialById(testimonialId);
  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  testimonial.deletedAt = new Date();
  await testimonial.save();
  return testimonial;
};

const getFeaturedTestimonials = async () => {
  const testimonials = await Testimonial.find({ featured: true, deletedAt: { $exists: false } }).limit(5);
  return testimonials;
};

export default {
  createTestimonial,
  queryTestimonials,
  getTestimonialById,
  updateTestimonialById,
  deleteTestimonialById,
  getFeaturedTestimonials,
};
