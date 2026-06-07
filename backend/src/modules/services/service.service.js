import Service from './service.model.js';
import { ApiError } from '../../utils/ApiError.js'; // Using ApiError for consistent error handling
import { ApiResponse } from '../../utils/ApiResponse.js'; // Using ApiResponse for consistent success responses

import { slugify } from '../../utils/slugify.js'; // Utility to generate URL-friendly slugs



/**
 * Retrieves all services based on provided query parameters.
 * Supports pagination, filtering by featured, status, and searching by keywords.
 * @param {Object} query - Query parameters for filtering and pagination.
 * @returns {ApiResponse} - A response object containing services and pagination info.
 */
const getAllServices = async (query) => {
  const { page = 1, limit = 12, featured, status, search, sort } = query;
  const skip = (page - 1) * limit; // Calculate documents to skip for pagination

  const filter = {};
  if (featured) filter.featured = featured === 'true'; // Filter by featured status
  if (status) filter.status = status; // Filter by service status
  if (search) {
    // Search across title, shortDescription, and description
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  let sortOptions = {};
  if (sort === 'newest') sortOptions.createdAt = -1; // Sort by newest first
  if (sort === 'oldest') sortOptions.createdAt = 1; // Sort by oldest first
  if (sort === 'displayOrder') sortOptions.displayOrder = 1; // Sort by display order

  // Fetch services with pagination and selected fields
  const services = await Service.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .select('title slug shortDescription featuredImage featured displayOrder status createdAt');

  const total = await Service.countDocuments(filter); // Total count of services matching the filter
  const totalPages = Math.ceil(total / limit); // Calculate total pages

  return new ApiResponse(200, {
    services,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
  }, 'Services retrieved successfully');
};

/**
 * Retrieves a single service by its slug.
 * @param {string} slug - The slug of the service to retrieve.
 * @returns {ApiResponse} - A response object containing the service data.
 * @throws {ApiError} - If the service is not found.
 */
const getSingleService = async (slug) => {
  const service = await Service.findOne({ slug });
  if (!service) {
    throw new ApiError(404, 'Service not found'); // Throw error if service doesn't exist
  }
  return new ApiResponse(200, service, 'Service retrieved successfully');
};

/**
 * Creates a new service.
 * @param {Object} serviceData - Data for the new service.
 * @param {string} userId - ID of the user creating the service.
 * @returns {ApiResponse} - A response object with the created service's basic info.
 */
const createService = async (serviceData, userId) => {
  const newService = new Service({
    ...serviceData,
    createdBy: userId, // Assign the creator of the service
  });
  await newService.save(); // Save the new service to the database
  return new ApiResponse(201, {
    _id: newService._id,
    title: newService.title,
    slug: newService.slug,
  }, 'Service created successfully');
};

/**
 * Updates an existing service.
 * @param {string} serviceId - ID of the service to update.
 * @param {Object} updateData - Data to update the service with.
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the service is not found.
 */
const updateService = async (serviceId, updateData) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new ApiError(404, 'Service not found'); // Throw error if service doesn't exist
  }

  // If title is updated, regenerate slug
  if (updateData.title && updateData.title !== service.title) {
    updateData.slug = slugify(updateData.title);
  }

  Object.assign(service, updateData); // Update service fields
  await service.save(); // Save the updated service
  return new ApiResponse(200, null, 'Service updated successfully');
};

/**
 * Soft deletes a service.
 * @param {string} serviceId - ID of the service to soft delete.
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the service is not found.
 */
const deleteService = async (serviceId) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new ApiError(404, 'Service not found'); // Throw error if service doesn't exist
  }
  await service.softDelete(); // Perform soft deletion
  return new ApiResponse(200, null, 'Service deleted successfully');
};

/**
 * Uploads a featured image for a service.
 * @param {string} serviceId - ID of the service.
 * @param {Object} file - The image file to upload.
 * @returns {ApiResponse} - A response object with the uploaded image info.
 * @throws {ApiError} - If the service is not found.
 */
const uploadFeaturedImage = async (serviceId, imageData) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  service.featuredImage = {
    publicId: imageData.public_id,
    secureUrl: imageData.secure_url,
  };
  await service.save();

  return new ApiResponse(200, service.featuredImage, 'Featured image uploaded successfully');
};

/**
 * Uploads multiple gallery images for a service.
 * @param {string} serviceId - ID of the service.
 * @param {Array<Object>} files - Array of image files to upload.
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the service is not found.
 */
const uploadGalleryImages = async (serviceId, imagesData) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  const newGalleryImages = imagesData.map(img => ({
    publicId: img.public_id,
    secureUrl: img.secure_url,
  }));

  service.gallery.push(...newGalleryImages);
  await service.save();

  return new ApiResponse(200, newGalleryImages, 'Gallery images uploaded successfully');
};

/**
 * Deletes a gallery image from a service.
 * @param {string} serviceId - ID of the service.
 * @param {string} imageId - publicId of the image to delete.
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the service or image is not found.
 */
const deleteGalleryImage = async (serviceId, imageId) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  // Check if the image to delete is the featured image
  if (service.featuredImage && service.featuredImage.publicId === imageId) {
    service.featuredImage = undefined; // Remove featured image
  } else {
    // Find and remove the image from the gallery array
    const initialLength = service.gallery.length;
    service.gallery.pull({ publicId: imageId }); // Mongoose method to remove subdocument
    if (service.gallery.length === initialLength) {
      throw new ApiError(404, 'Image not found in service gallery');
    }
  }

  await service.save();
  return new ApiResponse(200, null, 'Gallery image removed successfully');
};

/**
 * Retrieves all featured services.
 * @returns {ApiResponse} - A response object containing featured services.
 */
const getFeaturedServices = async () => {
  const services = await Service.find({ featured: true, status: 'published' })
    .sort({ displayOrder: 1, createdAt: -1 }) // Sort by display order then creation date
    .select('title slug shortDescription featuredImage');

  return new ApiResponse(200, services, 'Featured services retrieved successfully');
};

/**
 * Reorders services based on provided displayOrder values.
 * @param {Array<Object>} servicesToReorder - Array of objects with service ID and new displayOrder.
 * @returns {ApiResponse} - A response object indicating success.
 */
const reorderServices = async (servicesToReorder) => {
  // Prepare bulk write operations for efficient updates
  const bulkOperations = servicesToReorder.map(service => ({
    updateOne: {
      filter: { _id: service.id },
      update: { displayOrder: service.displayOrder },
    },
  }));

  await Service.bulkWrite(bulkOperations); // Execute bulk updates
  return new ApiResponse(200, null, 'Service order updated successfully');
};

export default {
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