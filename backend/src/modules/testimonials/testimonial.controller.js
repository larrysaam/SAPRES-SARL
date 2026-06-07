
import TestimonialService from './testimonial.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';

const createTestimonialController = async (req, res, next) => {
  try {
    const testimonial = await TestimonialService.createTestimonial(req.body);
    res
      .status(httpStatus.CREATED)
      .send(new ApiResponse(httpStatus.CREATED, testimonial, 'Testimonial created successfully'));
  } catch (error) {
    next(error);
  }
};

const getTestimonialsController = async (req, res, next) => {
  try {
    const filter = {};
    const options = {
      limit: req.query.limit,
      page: req.query.page,
      sortBy: req.query.sortBy,
      featured: req.query.featured,
      status: req.query.status,
    };
    const result = await TestimonialService.queryTestimonials(filter, options);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, result.data, 'Testimonials retrieved successfully', result.page, result.limit, result.totalDocuments, result.totalPages)
      );
  } catch (error) {
    next(error);
  }
};

const getTestimonialController = async (req, res, next) => {
  try {
    const testimonial = await TestimonialService.getTestimonialById(req.params.testimonialId);
    if (!testimonial) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Testimonial not found');
    }
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, testimonial, 'Testimonial retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const updateTestimonialController = async (req, res, next) => {
  try {
    const testimonial = await TestimonialService.updateTestimonialById(req.params.testimonialId, req.body);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, testimonial, 'Testimonial updated successfully'));
  } catch (error) {
    next(error);
  }
};

const deleteTestimonialController = async (req, res, next) => {
  try {
    await TestimonialService.deleteTestimonialById(req.params.testimonialId);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, null, 'Testimonial deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const getFeaturedTestimonialsController = async (req, res, next) => {
  try {
    const testimonials = await TestimonialService.getFeaturedTestimonials();
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, testimonials, 'Featured testimonials retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export default {
  createTestimonialController,
  getTestimonialsController,
  getTestimonialController,
  updateTestimonialController,
  deleteTestimonialController,
  getFeaturedTestimonialsController,
};
