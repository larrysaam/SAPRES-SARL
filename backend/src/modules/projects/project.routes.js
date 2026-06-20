import express from 'express';
const router = express.Router();
import projectController from './project.controller.js';

import roleMiddleware from '../../middlewares/role.middleware.js';

import { createProjectSchema, updateProjectSchema, reorderProjectsSchema } from './project.validation.js';

// Public routes
router.get('/', projectController.getAllProjects);
router.get('/featured', projectController.getFeaturedProjects);
router.get('/stats', projectController.getProjectStatistics);
router.get('/:slug', projectController.getSingleProject);


// Authenticated and authorized routes (Admin/Editor roles)
import authMiddleware from "../../middlewares/auth.middleware.js";



router.post(
  "/",
  projectController.validate(createProjectSchema),
  projectController.createProject
);
router.put(
  "/:id",
  projectController.validate(updateProjectSchema),
  projectController.updateProject
);
router.delete("/:id", projectController.deleteProject);

router.post(
  "/:id/featured-image",
  projectController.uploadFeaturedImage
);
router.post(
  "/:id/gallery",
  projectController.uploadGalleryImages
);
router.post(
  "/:id/before-images",
  projectController.uploadBeforeImages
);
router.post(
  "/:id/after-images",
  projectController.uploadAfterImages
);
router.delete("/:id/images/:imageId", projectController.deleteProjectImage);

router.patch(
  "/reorder",
  projectController.validate(reorderProjectsSchema),
  projectController.reorderProjects
);

export default router;
