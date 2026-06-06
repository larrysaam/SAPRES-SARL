const express = require('express');
const router = express.Router();
const BlogController = require('./blog.controller');
const auth = require('../../middlewares/auth.middleware');
const roles = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { upload } = require('../../middlewares/upload.middleware');
const { createBlogSchema, updateBlogSchema } = require('./blog.validation');

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
router.post('/:id/featured-image', auth, upload.single('image'), BlogController.uploadFeaturedImage);
router.post('/:id/gallery', auth, upload.array('images'), BlogController.uploadGallery);
router.delete('/:blogId/gallery/:imageId', auth, BlogController.deleteGalleryImage);

// Statistics route (Admin only)
router.get('/stats', auth, roles(['content_admin', 'super_admin']), BlogController.getStats);

module.exports = router;
