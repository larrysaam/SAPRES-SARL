import Testimonial from './testimonial.model.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';

const createTestimonial = async (testimonialBody) => {
  const testimonial = await Testimonial.create(testimonialBody);
  return testimonial;
};

const queryTestimonials = async (filter, options) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { deletedAt: { $exists: false } };

  if (options.featured) query.featured = options.featured === 'true';
  if (options.status) query.status = options.status;

  let sortOption = {};
  if (options.sortBy) {
    const parts = options.sortBy.split(':');
    sortOption[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  } else {
    sortOption = { createdAt: -1 };
  }

  const testimonials = await Testimonial.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalDocuments = await Testimonial.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    data: testimonials,
    page,
    limit,
    totalDocuments,
    totalPages,
  };
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
