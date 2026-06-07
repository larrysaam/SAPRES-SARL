import express from 'express';
const router = express.Router();
import serviceController from './service.controller.js'; // Import the service controller
import authMiddleware from '../../middlewares/auth.middleware.js'; // Middleware for authentication
import roleMiddleware from '../../middlewares/role.middleware.js'; // Middleware for role-based authorization

import { createServiceSchema, updateServiceSchema, reorderServicesSchema } from './service.validation.js'; // Joi schemas for validation

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
  serviceController.uploadFeaturedImage
);

// Route to upload multiple gallery images for a service
router.post(
  '/:id/gallery',
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

export default router;