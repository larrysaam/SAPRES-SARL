import express from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import homepageValidation from './homepage.validation.js';
import homepageController from './homepage.controller.js';

const router = express.Router();

// Public routes
router.route('/').get(homepageController.getHomepageController);

// Authenticated routes
router.use(auth);

router
  .route('/')
  .put(
    authorize('super_admin', 'content_admin'),
    validate(homepageValidation.updateHomepageSchema),
    homepageController.updateHomepageController
  );

// Image/video upload route - accepts JSON { secure_url, public_id, format, bytes }
router.post(
  '/hero-image',
  authorize('super_admin', 'content_admin'),
  homepageController.uploadHeroImageController
);

router.post(
  '/hero-video',
  authorize('super_admin', 'content_admin'),
  homepageController.uploadHeroVideoController
);

export default router;
