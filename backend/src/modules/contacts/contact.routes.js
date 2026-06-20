import express from 'express';
const router = express.Router();
import contactController from './contact.controller.js'; // Import the contact controller
import authMiddleware from '../../middlewares/auth.middleware.js'; // Middleware for authentication
import roleMiddleware from '../../middlewares/role.middleware.js'; // Middleware for role-based authorization
import { submitContactSchema, updateContactStatusSchema, addContactNoteSchema } from './contact.validation.js'; // Joi schemas for validation

// Public route for submitting a contact form
router.post(
  '/',
  contactController.validate(submitContactSchema), // Validate request body
  contactController.submitContact
);

// Authenticated and authorized routes (Admin/Editor roles)
// All routes below this middleware will require authentication
router.use(authMiddleware());
// All routes below this middleware will require the user to have 'admin' or 'editor' role
router.use(roleMiddleware(['super_admin', 'content_admin', 'sales_admin', 'hr_admin']));

// Route to get all contact requests
router.get('/', contactController.getAllContacts);

// Route to get a single contact request by ID
router.get('/:id', contactController.getSingleContact);

// Route to update the status of a contact request
router.patch(
  '/:id/status',
  contactController.validate(updateContactStatusSchema), // Validate request body
  contactController.updateContactStatus
);

// Route to add a note to a contact request
router.post(
  '/:id/notes',
  contactController.validate(addContactNoteSchema), // Validate request body
  contactController.addContactNote
);

// Route to soft delete a contact request by ID
router.delete('/:id', contactController.deleteContact);

export default router;
