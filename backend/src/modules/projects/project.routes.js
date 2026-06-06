const express = require('express');
const router = express.Router();
const projectController = require('./project.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const { uploadSingle, uploadMultiple } = require('../../middlewares/upload.middleware');
const { createProjectSchema, updateProjectSchema, reorderProjectsSchema } = require('./project.validation');

// Public routes
router.get('/', projectController.getAllProjects);
router.get('/featured', projectController.getFeaturedProjects);
router.get('/stats', projectController.getProjectStatistics);
router.get('/:slug', projectController.getSingleProject);

// Authenticated and authorized routes (Admin/Editor roles)
router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'editor']));

router.post(
  '/',
  projectController.validate(createProjectSchema),
  projectController.createProject
);
router.put(
  '/:id',
  projectController.validate(updateProjectSchema),
  projectController.updateProject
);
router.delete('/:id', projectController.deleteProject);

router.post(
  '/:id/featured-image',
  uploadSingle('image', 'projects/featured'),
  projectController.uploadFeaturedImage
);
router.post(
  '/:id/gallery',
  uploadMultiple('images', 'projects/gallery'),
  projectController.uploadGalleryImages
);
router.post(
  '/:id/before-images',
  uploadMultiple('images', 'projects/before'),
  projectController.uploadBeforeImages
);
router.post(
  '/:id/after-images',
  uploadMultiple('images', 'projects/after'),
  projectController.uploadAfterImages
);
router.delete('/:id/images/:imageId', projectController.deleteProjectImage);

router.patch(
  '/reorder',
  projectController.validate(reorderProjectsSchema),
  projectController.reorderProjects
);

module.exports = router;