import express from 'express';
const router = express.Router();
import serviceController from './service.controller.js';
import auth from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import { createServiceSchema, updateServiceSchema, reorderServicesSchema } from './service.validation.js';

// Public routes - accessible without authentication
router.get('/', serviceController.getAllServices);
router.get('/featured', serviceController.getFeaturedServices);
router.get('/:slug', serviceController.getSingleService);

// Authenticated routes for CRUD operations
router.post(
  '/',
  auth(),
  authorize('super_admin', 'content_admin', 'sales_admin'),
  serviceController.validate(createServiceSchema),
  serviceController.createService
);

router.put(
  '/:id',
  auth(),
  authorize('super_admin', 'content_admin', 'sales_admin'),
  serviceController.validate(updateServiceSchema),
  serviceController.updateService
);

router.delete(
  '/:id',
  auth(),
  authorize('super_admin', 'content_admin', 'sales_admin'),
  serviceController.deleteService
);

router.post(
  '/:id/featured-image',
  auth(),
  authorize('super_admin', 'content_admin', 'sales_admin'),
  serviceController.uploadFeaturedImage
);

router.post(
  '/:id/gallery',
  auth(),
  authorize('super_admin', 'content_admin', 'sales_admin'),
  serviceController.uploadGalleryImages
);

router.delete(
  '/:id/gallery/:imageId',
  auth(),
  authorize('super_admin', 'content_admin', 'sales_admin'),
  serviceController.deleteGalleryImage
);

router.patch(
  '/reorder',
  auth(),
  authorize('super_admin', 'content_admin', 'sales_admin'),
  serviceController.validate(reorderServicesSchema),
  serviceController.reorderServices
);

export default router;
