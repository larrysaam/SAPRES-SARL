
import express from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import testimonialValidation from './testimonial.validation.js';
import testimonialController from './testimonial.controller.js';

const router = express.Router();

// Public routes
router.get(
  '/',
  validate(testimonialValidation.getTestimonialsSchema),
  testimonialController.getTestimonialsController
);
router.get('/featured', testimonialController.getFeaturedTestimonialsController);

// Authenticated routes
router.use(auth); // Apply authentication middleware to all subsequent routes in this router

router.post(
  '/',
  authorize('super_admin', 'content_admin'),
  validate(testimonialValidation.createTestimonialSchema),
  testimonialController.createTestimonialController
);

router
  .route('/:testimonialId')
  .get(testimonialController.getTestimonialController)
  .put(
    authorize('super_admin', 'content_admin'),
    validate(testimonialValidation.updateTestimonialSchema),
    testimonialController.updateTestimonialController
  )
  .delete(authorize('super_admin', 'content_admin'), testimonialController.deleteTestimonialController);

export default router;
