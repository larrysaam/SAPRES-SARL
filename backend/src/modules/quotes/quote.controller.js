import quoteService from './quote.service.js';
import { requestQuoteSchema, updateQuoteStatusSchema, addQuoteNoteSchema, scheduleSiteVisitSchema } from './quote.validation.js';
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
 * Controller to request a new quote.
 * This is a public route and supports file uploads.
 */
const requestQuote = async (req, res, next) => {
  try {
    const { attachments } = req.body; // Expect an array of { secure_url, public_id }
    if (attachments && (!Array.isArray(attachments) || attachments.some(att => !att.secure_url || !att.public_id))) {
      throw new ApiError(400, "Invalid attachments format. Each attachment must have secure_url and public_id.");
    }
    const response = await quoteService.requestQuote(req.body, attachments);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
};

/**
 * Controller to get all quote requests.
 * Requires authentication and authorization.
 */
const getAllQuotes = async (req, res, next) => {
  try {
    const response = await quoteService.getAllQuotes(req.query);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get a single quote request by ID.
 * Requires authentication and authorization.
 */
const getSingleQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await quoteService.getSingleQuote(id);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update the status of a quote request.
 * Requires authentication and authorization.
 */
const updateQuoteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const response = await quoteService.updateQuoteStatus(id, status);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to add a note to a quote request.
 * Requires authentication and authorization.
 */
const addQuoteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    // Assuming req.user is populated by an authentication middleware
    const userId = req.user._id;
    const response = await quoteService.addQuoteNote(id, note, userId);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to schedule a site visit for a quote request.
 * Requires authentication and authorization.
 */
const scheduleSiteVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visitDetails = req.body;
    const response = await quoteService.scheduleSiteVisit(id, visitDetails);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get dashboard lead statistics.
 * Requires authentication and authorization.
 */
const getQuoteStatistics = async (req, res, next) => {
  try {
    const response = await quoteService.getQuoteStatistics();
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to export leads.
 * Requires authentication and authorization.
 */
const exportQuotes = async (req, res, next) => {
  try {
    const { format } = req.query;
    const fileBuffer = await quoteService.exportQuotes(format);

    let contentType;
    let fileName;

    if (format === 'csv') {
      contentType = 'text/csv';
      fileName = 'quotes.csv';
    } else if (format === 'excel') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = 'quotes.xlsx';
    } else {
      throw new ApiError(400, 'Unsupported export format');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

export default {
  validate,
  requestQuoteSchema,
  updateQuoteStatusSchema,
  addQuoteNoteSchema,
  scheduleSiteVisitSchema,
  requestQuote,
  getAllQuotes,
  getSingleQuote,
  updateQuoteStatus,
  addQuoteNote,
  scheduleSiteVisit,
  getQuoteStatistics,
  exportQuotes,
};
