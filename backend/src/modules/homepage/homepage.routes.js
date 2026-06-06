const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const upload = require('../../middlewares/upload.middleware');
const homepageValidation = require('./homepage.validation');
const homepageController = require('./homepage.controller');

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
  upload.single('heroImage'),
  validate(homepageValidation.uploadHeroImageSchema),
  homepageController.uploadHeroImageController
);

router.post(
  '/hero-video',
  authorize(['super_admin', 'content_admin']),
  upload.single('heroVideo'),
  validate(homepageValidation.uploadHeroVideoSchema),
  homepageController.uploadHeroVideoController
);

module.exports = router;
