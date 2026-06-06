import express from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import  authorize  from '../../middlewares/role.middleware.js';
import { uploadSingle } from '../../middlewares/upload.middleware.js';
import settingValidation from './setting.validation.js';
import settingController from './setting.controller.js';

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
  uploadSingle('logo'),
  validate(settingValidation.uploadLogoSchema),
  settingController.uploadLogoController
);

router.post(
  '/favicon',
  authorize(['super_admin']),
  uploadSingle('favicon'),
  validate(settingValidation.uploadFaviconSchema),
  settingController.uploadFaviconController
);

export default router;