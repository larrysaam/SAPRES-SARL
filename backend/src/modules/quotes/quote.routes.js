const express = require('express');
const router = express.Router();
const quoteController = require('./quote.controller'); // Import the quote controller
const authMiddleware = require('../../middlewares/auth.middleware'); // Middleware for authentication
const roleMiddleware = require('../../middlewares/role.middleware'); // Middleware for role-based authorization
const { uploadMultiple } = require('../../middlewares/upload.middleware'); // Middleware for file uploads
const { requestQuoteSchema, updateQuoteStatusSchema, addQuoteNoteSchema, scheduleSiteVisitSchema } = require('./quote.validation'); // Joi schemas for validation

// Public route for requesting a new quote (supports multiple file attachments)
router.post(
  '/',
  uploadMultiple('attachments', 'quotes/attachments'), // Middleware to handle multiple file uploads
  quoteController.validate(requestQuoteSchema), // Validate request body
  quoteController.requestQuote
);

// Authenticated and authorized routes (Admin/Editor roles)
// All routes below this middleware will require authentication
router.use(authMiddleware);
// All routes below this middleware will require the user to have 'admin' or 'editor' role
router.use(roleMiddleware(['admin', 'editor']));

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

module.exports = router;
