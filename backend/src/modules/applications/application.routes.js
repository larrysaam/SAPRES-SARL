import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import auth from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import { uploadFields } from '../../middlewares/upload.middleware.js'; // Using uploadFields for fields
import applicationValidation from './application.validation.js';
import applicationController from './application.controller.js';

const router = express.Router();

// Middleware for handling multiple file uploads for application submission
const uploadApplicationFiles = uploadFields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
  { name: 'idCard', maxCount: 1 },
  { name: 'diploma', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 5 },
]);

// Public route for submitting an application
router.post(
  '/',
  uploadApplicationFiles,
  validate(applicationValidation.createApplication),
  applicationController.createApplication
);

// Admin routes
router.route('/')
  .get(auth, authorize(['super_admin', 'hr_admin']), validate(applicationValidation.getApplications), applicationController.getApplications);

router.route('/stats')
  .get(auth, authorize(['super_admin', 'hr_admin']), applicationController.getApplicationStats);

router.route('/:applicationId')
  .get(auth, authorize(['super_admin', 'hr_admin']), validate(applicationValidation.getApplication), applicationController.getApplication)
  .delete(auth, authorize(['super_admin']), validate(applicationValidation.deleteApplication), applicationController.deleteApplication);

router.route('/:applicationId/status')
  .patch(auth, authorize(['super_admin', 'hr_admin']), validate(applicationValidation.updateApplicationStatus), applicationController.updateApplicationStatus);

router.route('/:applicationId/download/:documentType')
  .get(auth, authorize(['super_admin', 'hr_admin']), validate(applicationValidation.downloadDocument), applicationController.downloadDocument);

export default router;
