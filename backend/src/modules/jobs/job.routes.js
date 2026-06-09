
import express from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import jobValidation from './job.validation.js';
import jobController from './job.controller.js';

const router = express.Router();

// Public routes
router.get('/', validate(jobValidation.getJobsSchema), jobController.getJobsController);
router.get('/featured', jobController.getFeaturedJobsController);
router.get('/:slug', jobController.getJobController);

// Authenticated routes
router.use(auth()); // Apply authentication middleware to all subsequent routes in this router

router.post(
  '/',
  authorize('super_admin', 'content_admin', 'recruiter'),
  validate(jobValidation.createJobSchema),
  jobController.createJobController
);

router
  .route('/:jobId')
  .get(authorize('super_admin', 'content_admin', 'recruiter'), jobController.getJobByIdController)
  .put(
    authorize('super_admin', 'content_admin', 'recruiter'),
    validate(jobValidation.updateJobSchema),
    jobController.updateJobController
  )
  .delete(authorize('super_admin', 'content_admin', 'recruiter'), jobController.deleteJobController);

router.patch(
  '/:jobId/status',
  authorize('super_admin', 'content_admin', 'recruiter'),
  validate(jobValidation.updateJobStatusSchema),
  jobController.updateJobStatusController
);

export default router;
