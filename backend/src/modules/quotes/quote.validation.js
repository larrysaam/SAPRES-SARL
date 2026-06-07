import Joi from 'joi';

// Joi schema for customer details
const customerSchema = Joi.object({
  fullName: Joi.string().required().min(3).max(100),
  phone: Joi.string().required().min(7).max(20),
  email: Joi.string().email().required().max(100),
  location: Joi.string().optional().allow(''),
});

// Joi schema for electricity consumption details
const electricityConsumptionSchema = Joi.object({
  monthlyBill: Joi.number().min(0).optional(),
  usageDescription: Joi.string().optional().allow(''),
});

// Joi schema for requesting a new quote
const requestQuoteSchema = Joi.object({
  fullName: Joi.string().required().min(3).max(100),
  phone: Joi.string().required().min(7).max(20),
  email: Joi.string().email().required().max(100),
  location: Joi.string().optional().allow(''),
  projectType: Joi.string().optional().allow(''),
  propertyType: Joi.string().optional().allow(''),
  budgetRange: Joi.string().optional().allow(''),
  monthlyBill: Joi.number().min(0).optional(),
  usageDescription: Joi.string().optional().allow(''),
  requirements: Joi.string().optional().allow(''),
  attachments: Joi.array().items(Joi.object({
    secure_url: Joi.string().uri().required(),
    public_id: Joi.string().required(),
  })).optional().default([]),
});

// Joi schema for updating a quote's status
const updateQuoteStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'new',
      'under-review',
      'site-visit-required',
      'proposal-sent',
      'negotiation',
      'won',
      'lost'
    )
    .required(),
});

// Joi schema for adding a note to a quote
const addQuoteNoteSchema = Joi.object({
  note: Joi.string().required().min(5).max(500),
});

// Joi schema for scheduling a site visit
const scheduleSiteVisitSchema = Joi.object({
  visitDate: Joi.date().required(),
  visitTime: Joi.string().required().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  assignedEngineer: Joi.string().required().min(3).max(100),
});

export default {
  requestQuoteSchema,
  updateQuoteStatusSchema,
  addQuoteNoteSchema,
  scheduleSiteVisitSchema,
};
