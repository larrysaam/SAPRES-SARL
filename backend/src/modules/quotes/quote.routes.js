import express from 'express';
const router = express.Router();
import quoteController from './quote.controller.js'; // Import the quote controller
import authMiddleware from '../../middlewares/auth.middleware.js'; // Middleware for authentication
import roleMiddleware from '../../middlewares/role.middleware.js'; // Middleware for role-based authorization

import { requestQuoteSchema, updateQuoteStatusSchema, addQuoteNoteSchema, scheduleSiteVisitSchema } from './quote.validation.js'; // Joi schemas for validation

// Public route for requesting a new quote (supports multiple file attachments)
router.post(
  '/',
  quoteController.validate(requestQuoteSchema), // Validate request body
  quoteController.requestQuote
);

// Authenticated and authorized routes (Admin/Editor roles)
// All routes below this middleware will require authentication
router.use(authMiddleware());
// All routes below this middleware will require the user to have 'admin' or 'editor' role
router.use(roleMiddleware(['super_admin', 'content_admin', 'sales_admin', 'hr_admin']));

// Route to get all quote requests
router.get('/', quoteController.getAllQuotes);

// Route to get a single quote request by ID
router.get('/:id', quoteController.getSingleQuote);

// Route to update the status of a quote request
router.patch(
  '/:id/status',
  quoteController.validate(updateQuoteStatusSchema), // Validate request body
  quoteController.updateQuoteStatus
);

// Route to add a note to a quote request
router.post(
  '/:id/notes',
  quoteController.validate(addQuoteNoteSchema), // Validate request body
  quoteController.addQuoteNote
);

// Route to schedule a site visit for a quote request
router.patch(
  '/:id/site-visit',
  quoteController.validate(scheduleSiteVisitSchema), // Validate request body
  quoteController.scheduleSiteVisit
);

// Route to get dashboard lead statistics
router.get('/stats', quoteController.getQuoteStatistics);

// Route to export leads
router.get('/export', quoteController.exportQuotes);

export default router;
