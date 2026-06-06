const express = require('express');
const router = express.Router();
const serviceController = require('./service.controller'); // Import the service controller
const authMiddleware = require('../../middlewares/auth.middleware'); // Middleware for authentication
const roleMiddleware = require('../../middlewares/role.middleware'); // Middleware for role-based authorization
const { uploadSingle, uploadMultiple } = require('../../middlewares/upload.middleware'); // Middleware for file uploads
const { createServiceSchema, updateServiceSchema, reorderServicesSchema } = require('./service.validation'); // Joi schemas for validation

// Public routes - accessible without authentication
router.get('/', serviceController.getAllServices); // Get all services with optional filters
router.get('/featured', serviceController.getFeaturedServices); // Get only featured services
router.get('/:slug', serviceController.getSingleService); // Get a single service by its slug

// Authenticated and authorized routes (Admin/Editor roles)
// All routes below this middleware will require authentication
router.use(authMiddleware);
// All routes below this middleware will require the user to have 'admin' or 'editor' role
router.use(roleMiddleware(['admin', 'editor']));

// Route to create a new service
router.post(
  '/',
  serviceController.validate(createServiceSchema), // Validate request body
  serviceController.createService
);

// Route to update an existing service by ID
router.put(
  '/:id',
  serviceController.validate(updateServiceSchema), // Validate request body
  serviceController.updateService
);

// Route to soft delete a service by ID
router.delete('/:id', serviceController.deleteService);

// Route to upload a featured image for a service
router.post(
  '/:id/featured-image',
  uploadSingle('image', 'services/featured'), // Middleware to handle single image upload
  serviceController.uploadFeaturedImage
);

// Route to upload multiple gallery images for a service
router.post(
  '/:id/gallery',
  uploadMultiple('images', 'services/gallery'), // Middleware to handle multiple image uploads
  serviceController.uploadGalleryImages
);

// Route to delete a gallery image from a service
router.delete('/:id/gallery/:imageId', serviceController.deleteGalleryImage);

// Route to reorder services
router.patch(
  '/reorder',
  serviceController.validate(reorderServicesSchema), // Validate request body for reordering
  serviceController.reorderServices
);

module.exports = router;