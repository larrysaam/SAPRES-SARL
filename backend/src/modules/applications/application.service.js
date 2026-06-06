import httpStatus from 'http-status';
import Application from './application.model.js';
import { ApiError } from '../../utils/ApiError.js';
import cloudinary from '../../config/cloudinary.js';
import Job from '../jobs/job.model.js'; // Assuming a Job model exists

/**
 * Upload file to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder
 * @param {string} resourceType - 'image' or 'raw'
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadFileToCloudinary = async (buffer, folder, resourceType = 'raw') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(new ApiError(httpStatus.BAD_REQUEST, `Cloudinary upload failed: ${error.message}`));
        resolve(result);
      }
    ).end(buffer);
  });
};

/**
 * Create an application
 * @param {Object} applicationBody
 * @param {Object} files
 * @returns {Promise<Application>}
 */
const createApplication = async (applicationBody, files) => {
  const job = await Job.findById(applicationBody.jobId);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  const newApplication = {
    ...applicationBody,
    job: {
      _id: job._id,
      title: job.title,
      department: job.department, // Assuming job has a department field
    },
  };

  // Handle file uploads
  if (files.passportPhoto && files.passportPhoto[0]) {
    const result = await uploadFileToCloudinary(
      files.passportPhoto[0].buffer,
      `sapres/applications/${job._id}/passport-photos`,
      'image'
    );
    newApplication.passportPhoto = {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      originalName: files.passportPhoto[0].originalname,
      format: result.format,
      bytes: files.passportPhoto[0].size,
      resourceType: result.resource_type,
    };
  }

  if (files.cv && files.cv[0]) {
    const result = await uploadFileToCloudinary(
      files.cv[0].buffer,
      `sapres/applications/${job._id}/cvs`
    );
    newApplication.cv = {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      originalName: files.cv[0].originalname,
      format: result.format,
      bytes: files.cv[0].size,
      resourceType: result.resource_type,
    };
  }

  if (files.idCard && files.idCard[0]) {
    const result = await uploadFileToCloudinary(
      files.idCard[0].buffer,
      `sapres/applications/${job._id}/id-cards`,
      'image'
    );
    newApplication.idCard = {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      originalName: files.idCard[0].originalname,
      format: result.format,
      bytes: files.idCard[0].size,
      resourceType: result.resource_type,
    };
  }

  if (files.diploma && files.diploma[0]) {
    const result = await uploadFileToCloudinary(
      files.diploma[0].buffer,
      `sapres/applications/${job._id}/diplomas`
    );
    newApplication.diploma = {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      originalName: files.diploma[0].originalname,
      format: result.format,
      bytes: files.diploma[0].size,
      resourceType: result.resource_type,
    };
  }

  if (files.additionalDocuments && files.additionalDocuments.length > 0) {
    newApplication.additionalDocuments = await Promise.all(
      files.additionalDocuments.map(async (file) => {
        const result = await uploadFileToCloudinary(
          file.buffer,
          `sapres/applications/${job._id}/additional-documents`
        );
        return {
          publicId: result.public_id,
          secureUrl: result.secure_url,
          originalName: file.originalname,
          format: result.format,
          bytes: file.size,
          resourceType: result.resource_type,
        };
      })
    );
  }

  return Application.create(newApplication);
};

/**
 * Query for applications
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryApplications = async (filter, options) => {
  const { limit, page, sortBy, search, status, jobId } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) {
    query.status = status;
  }
  if (jobId) {
    query['job._id'] = jobId;
  }
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { 'job.title': { $regex: search, $options: 'i' } },
    ];
  }

  const sort = {};
  if (sortBy) {
    const [sortField, sortOrder] = sortBy.split(':');
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1; // Default sort
  }

  const applications = await Application.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('applicationNumber firstName lastName email phone job.title highestEducation yearsOfExperience status createdAt');

  const totalDocuments = await Application.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    page,
    limit,
    totalDocuments,
    totalPages,
    data: applications,
  };
};

/**
 * Get application by id
 * @param {ObjectId} id
 * @returns {Promise<Application>}
 */
const getApplicationById = async (id) => {
  return Application.findById(id);
};

/**
 * Update application status by id
 * @param {ObjectId} applicationId
 * @param {Object} updateBody
 * @returns {Promise<Application>}
 */
const updateApplicationStatus = async (applicationId, updateBody) => {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Application not found');
  }
  Object.assign(application, updateBody);
  application.reviewedAt = new Date();
  await application.save();
  return application;
};

/**
 * Delete application by id
 * @param {ObjectId} applicationId
 * @returns {Promise<Application>}
 */
const deleteApplicationById = async (applicationId) => {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Application not found');
  }
  // TODO: Delete files from Cloudinary
  await application.deleteOne();
  return application;
};

/**
 * Get document download URL
 * @param {ObjectId} applicationId
 * @param {string} documentType
 * @returns {Promise<string>}
 */
const getDocumentDownloadUrl = async (applicationId, documentType) => {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Application not found');
  }

  let fileObject;
  switch (documentType) {
    case 'cv':
      fileObject = application.cv;
      break;
    case 'diploma':
      fileObject = application.diploma;
      break;
    case 'id-card':
      fileObject = application.idCard;
      break;
    case 'passport-photo':
      fileObject = application.passportPhoto;
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid document type');
  }

  if (!fileObject || !fileObject.secureUrl) {
    throw new ApiError(httpStatus.NOT_FOUND, `${documentType} not found for this application`);
  }

  return fileObject.secureUrl;
};

/**
 * Get application statistics for dashboard
 * @returns {Promise<Object>}
 */
const getApplicationStats = async () => {
  const stats = await Application.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    totalApplications: 0,
    pending: 0,
    underReview: 0,
    shortlisted: 0,
    interviewScheduled: 0,
    interviewed: 0,
    selected: 0,
    rejected: 0,
    withdrawn: 0,
  };

  stats.forEach((stat) => {
    result[stat._id] = stat.count;
    result.totalApplications += stat.count;
  });

  return result;
};


export default {
  createApplication,
  queryApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplicationById,
  getDocumentDownloadUrl,
  getApplicationStats,
};