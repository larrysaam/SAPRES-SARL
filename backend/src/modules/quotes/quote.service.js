const Quote = require('./quote.model');
const ApiError = require('../../utils/ApiError'); // For consistent error handling
const ApiResponse = require('../../utils/ApiResponse'); // For consistent success responses
const cloudinary = require('../../config/cloudinary'); // Cloudinary configuration for image uploads
const generateSequentialNumber = require('../../utils/generateSequentialNumber'); // Utility to generate sequential quote numbers

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (file, folder) => {
  if (!file) return null; // If no file is provided, return null

  // Upload the file to Cloudinary
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `sapres/quotes/${folder}`, // Specify the folder in Cloudinary
  });
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
};

// Helper function to delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return; // If no publicId is provided, do nothing
  await cloudinary.uploader.destroy(publicId); // Destroy the image on Cloudinary
};

/**
 * Requests a new quote.
 * @param {Object} quoteData - Data from the quote request form.
 * @param {Array<Object>} files - Array of attachment files.
 * @returns {ApiResponse} - A response object with the created quote's basic info.
 */
const requestQuote = async (quoteData, files) => {
  // Find the last quote to generate a new sequential quote number
  const lastQuote = await Quote.findOne().sort({ createdAt: -1 });
  const lastQuoteNumber = lastQuote ? parseInt(lastQuote.quoteNumber.split('-')[2]) : 0;
  const quoteNumber = generateSequentialNumber('SAP-QT-', lastQuoteNumber);

  const newQuote = new Quote({
    quoteNumber,
    customer: {
      fullName: quoteData.fullName,
      phone: quoteData.phone,
      email: quoteData.email,
      location: quoteData.location,
    },
    projectType: quoteData.projectType,
    propertyType: quoteData.propertyType,
    budgetRange: quoteData.budgetRange,
    electricityConsumption: {
      monthlyBill: quoteData.monthlyBill,
      usageDescription: quoteData.usageDescription,
    },
    requirements: quoteData.requirements,
  });

  // Upload attachments if any
  if (files && files.length > 0) {
    const uploadedAttachments = await Promise.all(
      files.map((file) => uploadImageToCloudinary(file, `${newQuote._id}/attachments`))
    );
    newQuote.attachments.push(...uploadedAttachments);
  }

  await newQuote.save(); // Save the new quote request to the database
  return new ApiResponse(201, {
    _id: newQuote._id,
    quoteNumber: newQuote.quoteNumber,
    status: newQuote.status,
  }, 'Quotation request submitted successfully.');
};

/**
 * Retrieves all quote requests based on provided query parameters.
 * Supports pagination, filtering by status, and searching by keywords.
 * @param {Object} query - Query parameters for filtering and pagination.
 * @returns {ApiResponse} - A response object containing quotes and pagination info.
 */
const getAllQuotes = async (query) => {
  const { page = 1, limit = 20, status, search } = query;
  const skip = (page - 1) * limit; // Calculate documents to skip for pagination

  const filter = {};
  if (status) filter.status = status; // Filter by quote status
  if (search) {
    // Search across customer name, email, project type, quote number
    filter.$or = [
      { 'customer.fullName': { $regex: search, $options: 'i' } },
      { 'customer.email': { $regex: search, $options: 'i' } },
      { projectType: { $regex: search, $options: 'i' } },
      { quoteNumber: { $regex: search, $options: 'i' } },
    ];
  }

  // Fetch quotes with pagination and selected fields
  const quotes = await Quote.find(filter)
    .sort({ createdAt: -1 }) // Sort by newest first
    .skip(skip)
    .limit(limit)
    .select('quoteNumber customer.fullName projectType status createdAt');

  const total = await Quote.countDocuments(filter); // Total count of quotes matching the filter
  const totalPages = Math.ceil(total / limit); // Calculate total pages

  return new ApiResponse(200, {
    quotes,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
  }, 'Quotations retrieved successfully');
};

/**
 * Retrieves a single quote request by its ID.
 * @param {string} quoteId - The ID of the quote request to retrieve.
 * @returns {ApiResponse} - A response object containing the full quote data.
 * @throws {ApiError} - If the quote request is not found.
 */
const getSingleQuote = async (quoteId) => {
  const quote = await Quote.findById(quoteId);
  if (!quote) {
    throw new ApiError(404, 'Quotation request not found'); // Throw error if quote doesn't exist
  }
  return new ApiResponse(200, quote, 'Quotation request retrieved successfully');
};

/**
 * Updates the status of a quote request.
 * @param {string} quoteId - ID of the quote request to update.
 * @param {string} newStatus - The new status for the quote request.
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the quote request is not found.
 */
const updateQuoteStatus = async (quoteId, newStatus) => {
  const quote = await Quote.findById(quoteId);
  if (!quote) {
    throw new ApiError(404, 'Quotation request not found');
  }
  quote.status = newStatus; // Update the status
  await quote.save(); // Save the updated quote
  return new ApiResponse(200, null, 'Quotation status updated successfully');
};

/**
 * Adds a note to a quote request.
 * @param {string} quoteId - ID of the quote request.
 * @param {string} noteContent - The content of the note.
 * @param {string} userId - ID of the user adding the note.
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the quote request is not found.
 */
const addQuoteNote = async (quoteId, noteContent, userId) => {
  const quote = await Quote.findById(quoteId);
  if (!quote) {
    throw new ApiError(404, 'Quotation request not found');
  }
  quote.notes.push({ user: userId, comment: noteContent }); // Add the new note
  await quote.save(); // Save the updated quote
  return new ApiResponse(200, null, 'Note added successfully');
};

/**
 * Schedules a site visit for a quote request.
 * @param {string} quoteId - ID of the quote request.
 * @param {Object} visitDetails - Details of the site visit (date, time, engineer).
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the quote request is not found.
 */
const scheduleSiteVisit = async (quoteId, visitDetails) => {
  const quote = await Quote.findById(quoteId);
  if (!quote) {
    throw new ApiError(404, 'Quotation request not found');
  }
  quote.siteVisit = visitDetails; // Update site visit details
  await quote.save(); // Save the updated quote
  return new ApiResponse(200, null, 'Site visit scheduled successfully');
};

/**
 * Retrieves dashboard lead statistics.
 * @returns {ApiResponse} - A response object containing lead statistics.
 */
const getQuoteStatistics = async () => {
  const totalLeads = await Quote.countDocuments();
  const newLeads = await Quote.countDocuments({ status: 'new' });
  const underReview = await Quote.countDocuments({ status: 'under-review' });
  const proposalSent = await Quote.countDocuments({ status: 'proposal-sent' });
  const negotiation = await Quote.countDocuments({ status: 'negotiation' });
  const wonProjects = await Quote.countDocuments({ status: 'won' });
  const lostProjects = await Quote.countDocuments({ status: 'lost' });

  // Placeholder for conversion rate and estimated pipeline value - would require more complex logic
  const conversionRate = (wonProjects / totalLeads) * 100 || 0;
  const estimatedPipelineValue = 850000000; // Example value

  return new ApiResponse(200, {
    totalLeads,
    newLeads,
    underReview,
    proposalSent,
    negotiation,
    wonProjects,
    lostProjects,
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    estimatedPipelineValue,
  }, 'Lead statistics retrieved successfully');
};

/**
 * Exports leads in a specified format (Excel or CSV).
 * Placeholder implementation - requires a dedicated library for file generation.
 * @param {string} format - The desired export format ('excel' or 'csv').
 * @returns {Promise<Buffer>} - A promise that resolves to the file buffer.
 * @throws {ApiError} - If the format is not supported.
 */
const exportQuotes = async (format) => {
  const quotes = await Quote.find().lean(); // Fetch all quotes as plain JavaScript objects

  if (format === 'csv') {
    // Example: Basic CSV generation (requires 'csv-stringify' or similar)
    const { stringify } = require('csv-stringify');
    const columns = Object.keys(quotes[0] || {}); // Get headers from the first quote
    const data = [
      columns,
      ...quotes.map(quote => columns.map(col => {
        // Handle nested objects for customer and electricityConsumption
        if (col.startsWith('customer.')) {
          return quote.customer[col.split('.')[1]];
        }
        if (col.startsWith('electricityConsumption.')) {
          return quote.electricityConsumption[col.split('.')[1]];
        }
        return quote[col];
      }))
    ];

    return new Promise((resolve, reject) => {
      stringify(data, (err, output) => {
        if (err) return reject(new ApiError(500, 'Failed to generate CSV'));
        resolve(Buffer.from(output));
      });
    });
  } else if (format === 'excel') {
    // Example: Basic Excel generation (requires 'exceljs' or similar)
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quotes');

    // Add headers
    const headers = Object.keys(quotes[0] || {});
    worksheet.addRow(headers);

    // Add data
    quotes.forEach(quote => {
      const row = headers.map(header => {
        if (header.startsWith('customer.')) {
          return quote.customer[header.split('.')[1]];
        }
        if (header.startsWith('electricityConsumption.')) {
          return quote.electricityConsumption[header.split('.')[1]];
        }
        return quote[header];
      });
      worksheet.addRow(row);
    });

    return workbook.xlsx.writeBuffer();
  } else {
    throw new ApiError(400, 'Unsupported export format. Please use "csv" or "excel".');
  }
};


module.exports = {
  requestQuote,
  getAllQuotes,
  getSingleQuote,
  updateQuoteStatus,
  addQuoteNote,
  scheduleSiteVisit,
  getQuoteStatistics,
  exportQuotes,
};