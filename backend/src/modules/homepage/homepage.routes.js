import express from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import { uploadSingle } from '../../middlewares/upload.middleware.js';
import homepageValidation from './homepage.validation.js';
import homepageController from './homepage.controller.js';

const router = express.Router();

// Public routes
router.route('/').get(homepageController.getHomepageController);

// Authenticated routes
router.use(auth); // Apply authentication middleware to all subsequent routes in this router

router
  .route('/')
  .put(
    authorize(['super_admin', 'content_admin']),
    validate(homepageValidation.updateHomepageSchema),
    homepageController.updateHomepageController
  );

router.post(
  '/hero-image',
  authorize(['super_admin', 'content_admin']),
  uploadSingle('heroImage'),
  validate(homepageValidation.uploadHeroImageSchema),
  homepageController.uploadHeroImageController
);

router.post(
  '/hero-video',
  authorize(['super_admin', 'content_admin']),
  uploadSingle('heroVideo'),
  validate(homepageValidation.uploadHeroVideoSchema),
  homepageController.uploadHeroVideoController
);

export default router;
