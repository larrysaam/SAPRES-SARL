const express = require('express');
const router = express.Router();
const contactController = require('./contact.controller'); // Import the contact controller
const authMiddleware = require('../../middlewares/auth.middleware'); // Middleware for authentication
const roleMiddleware = require('../../middlewares/role.middleware'); // Middleware for role-based authorization
const { submitContactSchema, updateContactStatusSchema, addContactNoteSchema } = require('./contact.validation'); // Joi schemas for validation

// Public route for submitting a contact form
router.post(
  '/',
  contactController.validate(submitContactSchema), // Validate request body
  contactController.submitContact
);

// Authenticated and authorized routes (Admin/Editor roles)
// All routes below this middleware will require authentication
router.use(authMiddleware);
// All routes below this middleware will require the user to have 'admin' or 'editor' role
router.use(roleMiddleware(['admin', 'editor']));

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

module.exports = router;
