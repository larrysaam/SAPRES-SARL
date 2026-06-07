import httpStatus from 'http-status';
import applicationService from './application.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

const createApplication = async (req, res, next) => {
  try {
    const application = await applicationService.createApplication(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, application, 'Application submitted successfully'));
  } catch (error) {
    next(error);
  }
};

const getApplications = async (req, res) => {
  const filter = {};
  const options = req.query;
  const result = await applicationService.queryApplications(filter, options);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, result.data, 'Applications retrieved successfully', result.page, result.limit, result.totalDocuments, result.totalPages));
};

const getApplication = async (req, res) => {
  const application = await applicationService.getApplicationById(req.params.applicationId);
  if (!application) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Application not found');
  }
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, application, 'Application retrieved successfully'));
};

const updateApplicationStatus = async (req, res) => {
  const application = await applicationService.updateApplicationStatus(req.params.applicationId, req.body);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, application, 'Application status updated successfully'));
};

const deleteApplication = async (req, res) => {
  await applicationService.deleteApplicationById(req.params.applicationId);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Application deleted successfully'));
};

const downloadDocument = async (req, res) => {
  const { documentType } = req.params;
  const downloadUrl = await applicationService.getDocumentDownloadUrl(req.params.applicationId, documentType);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, { downloadUrl }, 'Document download URL retrieved successfully'));
};

const getApplicationStats = async (req, res) => {
  const stats = await applicationService.getApplicationStats();
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, stats, 'Application statistics retrieved successfully'));
};

export default {
  createApplication,
  getApplications,
  getApplication,
  updateApplicationStatus,
  deleteApplication,
  downloadDocument,
  getApplicationStats,
};