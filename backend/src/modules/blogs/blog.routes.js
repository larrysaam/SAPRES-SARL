import express from 'express';
const router = express.Router();
import BlogController from './blog.controller.js';
import auth from '../../middlewares/auth.middleware.js';
import roles from '../../middlewares/role.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { createBlogSchema, updateBlogSchema } from './blog.validation.js';

// Public routes
router.get('/', BlogController.getAll);
router.get('/featured', BlogController.getFeatured);
router.get('/search', BlogController.search);
router.get('/:slug/related', BlogController.getRelated);
router.get('/:slug', BlogController.getBySlug);
router.post('/:id/view', BlogController.incrementViews);

// Protected routes (Auth required)
router.post('/', auth, validate(createBlogSchema), BlogController.create);
router.get('/:id', auth, BlogController.getById);
router.put('/:id', auth, validate(updateBlogSchema), BlogController.update);
router.delete('/:id', auth, BlogController.delete);

// Image upload routes
router.post('/:id/featured-image', auth, BlogController.uploadFeaturedImage);
router.post('/:id/gallery', auth, BlogController.uploadGallery);
router.delete('/:blogId/gallery/:imageId', auth, BlogController.deleteGalleryImage);

// Statistics route (Admin only)
router.get('/stats', auth, roles(['content_admin', 'super_admin']), BlogController.getStats);

export default router;
