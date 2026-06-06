const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const upload = require('../../middlewares/upload.middleware');
const settingValidation = require('./setting.validation');
const settingController = require('./setting.controller');

const router = express.Router();

// Public routes
router.route('/').get(settingController.getSettingsController);

// Authenticated routes
router.use(auth); // Apply authentication middleware to all subsequent routes in this router

router
  .route('/')
  .put(
    authorize(['super_admin']),
    validate(settingValidation.updateSettingsSchema),
    settingController.updateSettingsController
  );

router.post(
  '/logo',
  authorize(['super_admin']),
  upload.single('logo'),
  validate(settingValidation.uploadLogoSchema),
  settingController.uploadLogoController
);

router.post(
  '/favicon',
  authorize(['super_admin']),
  upload.single('favicon'),
  validate(settingValidation.uploadFaviconSchema),
  settingController.uploadFaviconController
);

module.exports = router;