import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import auth from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import applicationValidation from './application.validation.js';
import applicationController from './application.controller.js';

const router = express.Router();

// Public route for submitting an application
router.post(
  '/',
  validate(applicationValidation.createApplication),
  applicationController.createApplication
);

// Admin routes — includes all admin roles that need access to the Recruitment page
const adminRoles = ['super_admin', 'hr_admin', 'recruiter', 'sales_admin'];
router.route('/')
  .get(auth(), authorize(...adminRoles), validate(applicationValidation.getApplications), applicationController.getApplications);

router.route('/stats')
  .get(auth(), authorize(...adminRoles), applicationController.getApplicationStats);

router.route('/:applicationId')
  .get(auth(), authorize(...adminRoles), validate(applicationValidation.getApplication), applicationController.getApplication)
  .delete(auth(), authorize(['super_admin']), validate(applicationValidation.deleteApplication), applicationController.deleteApplication);

router.route('/:applicationId/status')
  .patch(auth(), authorize(...adminRoles), validate(applicationValidation.updateApplicationStatus), applicationController.updateApplicationStatus);

router.route('/:applicationId/download/:documentType')
  .get(auth(), authorize(...adminRoles), validate(applicationValidation.downloadDocument), applicationController.downloadDocument);

export default router;
