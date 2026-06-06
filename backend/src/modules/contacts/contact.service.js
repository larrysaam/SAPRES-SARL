const Contact = require('./contact.model');
const ApiError = require('../../utils/ApiError'); // For consistent error handling
const ApiResponse = require('../../utils/ApiResponse'); // For consistent success responses

/**
 * Submits a new contact form request.
 * @param {Object} contactData - Data from the contact form.
 * @returns {ApiResponse} - A response object with the created contact's basic info.
 */
const submitContact = async (contactData) => {
  const newContact = new Contact(contactData);
  await newContact.save(); // Save the new contact request to the database
  return new ApiResponse(201, {
    _id: newContact._id,
    status: newContact.status,
  }, 'Your inquiry has been submitted successfully.');
};

/**
 * Retrieves all contact requests based on provided query parameters.
 * Supports pagination, filtering by status, and searching by keywords.
 * @param {Object} query - Query parameters for filtering and pagination.
 * @returns {ApiResponse} - A response object containing contacts and pagination info.
 */
const getAllContacts = async (query) => {
  const { page = 1, limit = 20, status, search } = query;
  const skip = (page - 1) * limit; // Calculate documents to skip for pagination

  const filter = {};
  if (status) filter.status = status; // Filter by contact status
  if (search) {
    // Search across fullName, email, subject, and message
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }

  // Fetch contacts with pagination and selected fields
  const contacts = await Contact.find(filter)
    .sort({ createdAt: -1 }) // Sort by newest first
    .skip(skip)
    .limit(limit)
    .select('fullName phone email subject status createdAt');

  const total = await Contact.countDocuments(filter); // Total count of contacts matching the filter
  const totalPages = Math.ceil(total / limit); // Calculate total pages

  return new ApiResponse(200, {
    contacts,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
  }, 'Contact requests retrieved successfully');
};

/**
 * Retrieves a single contact request by its ID.
 * @param {string} contactId - The ID of the contact request to retrieve.
 * @returns {ApiResponse} - A response object containing the full contact data.
 * @throws {ApiError} - If the contact request is not found.
 */
const getSingleContact = async (contactId) => {
  const contact = await Contact.findById(contactId);
  if (!contact) {
    throw new ApiError(404, 'Contact request not found'); // Throw error if contact doesn't exist
  }
  return new ApiResponse(200, contact, 'Contact request retrieved successfully');
};

/**
 * Updates the status of a contact request.
 * @param {string} contactId - ID of the contact request to update.
 * @param {string} newStatus - The new status for the contact request.
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the contact request is not found.
 */
const updateContactStatus = async (contactId, newStatus) => {
  const contact = await Contact.findById(contactId);
  if (!contact) {
    throw new ApiError(404, 'Contact request not found');
  }
  contact.status = newStatus; // Update the status
  await contact.save(); // Save the updated contact
  return new ApiResponse(200, null, 'Contact status updated successfully');
};

/**
 * Adds a note to a contact request.
 * @param {string} contactId - ID of the contact request.
 * @param {string} noteContent - The content of the note.
 * @param {string} userId - ID of the user adding the note.
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the contact request is not found.
 */
const addContactNote = async (contactId, noteContent, userId) => {
  const contact = await Contact.findById(contactId);
  if (!contact) {
    throw new ApiError(404, 'Contact request not found');
  }
  contact.notes.push({ user: userId, comment: noteContent }); // Add the new note
  await contact.save(); // Save the updated contact
  return new ApiResponse(200, null, 'Note added successfully');
};

/**
 * Soft deletes a contact request.
 * @param {string} contactId - ID of the contact request to soft delete.
 * @returns {ApiResponse} - A response object indicating success.
 * @throws {ApiError} - If the contact request is not found.
 */
const deleteContact = async (contactId) => {
  const contact = await Contact.findById(contactId);
  if (!contact) {
    throw new ApiError(404, 'Contact request not found');
  }
  await contact.softDelete(); // Perform soft deletion
  return new ApiResponse(200, null, 'Contact deleted successfully');
};

module.exports = {
  submitContact,
  getAllContacts,
  getSingleContact,
  updateContactStatus,
  addContactNote,
  deleteContact,
};