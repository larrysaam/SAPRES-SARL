import serviceService from './service.service.js';

import { ApiError } from '../../utils/ApiError.js'; // For consistent error handling
import { ApiResponse } from '../../utils/ApiResponse.js'; // For consistent success responses

// Helper function for Joi validation middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    // If validation fails, pass an ApiError to the next middleware
    return next(new ApiError(400, error.details[0].message));
  }
  next(); // If validation succeeds, proceed to the next middleware/controller
};

/**
 * Controller to get all services.
 * Handles query parameters for filtering, pagination, and sorting.
 */
const getAllServices = async (req, res, next) => {
  try {
    const response = await serviceService.getAllServices(req.query);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
};

/**
 * Controller to get a single service by its slug.
 */
const getSingleService = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const response = await serviceService.getSingleService(slug);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to create a new service.
 * Requires authentication and authorization.
 */
const createService = async (req, res, next) => {
  try {
    // Assuming req.user is populated by an authentication middleware
    const userId = req.user._id;
    const response = await serviceService.createService(req.body, userId);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update an existing service.
 * Requires authentication and authorization.
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await serviceService.updateService(id, req.body);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to soft delete a service.
 * Requires authentication and authorization.
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await serviceService.deleteService(id);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to upload a featured image for a service.
 * Uses uploadSingle middleware to handle file upload.
 */
const uploadFeaturedImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { secure_url, public_id } = req.body;

    if (!secure_url || !public_id) {
      throw new ApiError(400, 'Missing secure_url or public_id for featured image');
    }

    const response = await serviceService.uploadFeaturedImage(id, { secure_url, public_id });
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to upload multiple gallery images for a service.
 * Uses uploadMultiple middleware to handle file uploads.
 */
const uploadGalleryImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { images } = req.body; // Expect an array of { secure_url, public_id }

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new ApiError(400, 'No gallery images provided or invalid format');
    }

    // Validate each image object in the array
    for (const image of images) {
      if (!image.secure_url || !image.public_id) {
        throw new ApiError(400, 'Each gallery image must have secure_url and public_id');
      }
    }

    const response = await serviceService.uploadGalleryImages(id, images);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete a gallery image from a service.
 */
const deleteGalleryImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const response = await serviceService.deleteGalleryImage(id, imageId);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get all featured services.
 */
const getFeaturedServices = async (req, res, next) => {
  try {
    const response = await serviceService.getFeaturedServices();
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to reorder services.
 * Requires authentication and authorization.
 */
const reorderServices = async (req, res, next) => {
  try {
    const response = await serviceService.reorderServices(req.body.services);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  validate,

  getAllServices,
  getSingleService,
  createService,
  updateService,
  deleteService,
  uploadFeaturedImage,
  uploadGalleryImages,
  deleteGalleryImage,
  getFeaturedServices,
  reorderServices,
};
