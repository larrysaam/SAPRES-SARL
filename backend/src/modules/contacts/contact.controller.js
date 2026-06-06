import contactService from './contact.service.js';
import { submitContactSchema, updateContactStatusSchema, addContactNoteSchema } from './contact.validation.js';
import { ApiError } from '../../utils/ApiError.js'; // For consistent error handling

// Helper function for Joi validation middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    // If validation fails, pass an ApiError to the next middleware
    return next(new ApiError(400, error.details[0].message));
  }
  next(); // If validation succeeds, proceed to the next middleware/controller
};

/**
 * Controller to submit a new contact form.
 * This is a public route.
 */
const submitContact = async (req, res, next) => {
  try {
    const response = await contactService.submitContact(req.body);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
};

/**
 * Controller to get all contact requests.
 * Requires authentication and authorization.
 */
const getAllContacts = async (req, res, next) => {
  try {
    const response = await contactService.getAllContacts(req.query);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get a single contact request by ID.
 * Requires authentication and authorization.
 */
const getSingleContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await contactService.getSingleContact(id);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update the status of a contact request.
 * Requires authentication and authorization.
 */
const updateContactStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const response = await contactService.updateContactStatus(id, status);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to add a note to a contact request.
 * Requires authentication and authorization.
 */
const addContactNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    // Assuming req.user is populated by an authentication middleware
    const userId = req.user._id;
    const response = await contactService.addContactNote(id, note, userId);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to soft delete a contact request.
 * Requires authentication and authorization.
 */
const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await contactService.deleteContact(id);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  validate,
  submitContactSchema,
  updateContactStatusSchema,
  addContactNoteSchema,
  submitContact,
  getAllContacts,
  getSingleContact,
  updateContactStatus,
  addContactNote,
  deleteContact,
};
