const Joi = require('joi');

// Joi schema for submitting a new contact form
const submitContactSchema = Joi.object({
  fullName: Joi.string().required().min(3).max(100),
  phone: Joi.string().required().min(7).max(20), // Basic phone validation
  email: Joi.string().email().required().max(100),
  subject: Joi.string().required().min(5).max(255),
  message: Joi.string().required().min(10).max(1000),
});

// Joi schema for updating a contact's status
const updateContactStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'contacted', 'qualified', 'closed').required(),
});

// Joi schema for adding a note to a contact
const addContactNoteSchema = Joi.object({
  note: Joi.string().required().min(5).max(500),
});

module.exports = {
  submitContactSchema,
  updateContactStatusSchema,
  addContactNoteSchema,
};