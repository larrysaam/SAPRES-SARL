
import JobService from './job.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';

const createJobController = async (req, res, next) => {
  try {
    const job = await JobService.createJob(req.body);
    res
      .status(httpStatus.CREATED)
      .send(new ApiResponse(httpStatus.CREATED, job, 'Job created successfully'));
  } catch (error) {
    next(error);
  }
};

const getJobsController = async (req, res, next) => {
  try {
    const filter = {};
    const options = {
      limit: req.query.limit,
      page: req.query.page,
      sortBy: req.query.sort ? req.query.sort : undefined,
      search: req.query.search,
      department: req.query.department,
      featured: req.query.featured,
      status: req.query.status,
    };
    const result = await JobService.queryJobs(filter, options);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, result.data, 'Jobs retrieved successfully', result.page, result.limit, result.totalDocuments, result.totalPages)
      );
  } catch (error) {
    next(error);
  }
};

const getFeaturedJobsController = async (req, res, next) => {
  try {
    const jobs = await JobService.getFeaturedJobs();
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, jobs, 'Featured jobs retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const getJobController = async (req, res, next) => {
  try {
    const job = await JobService.getJobBySlug(req.params.slug);
    if (!job) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
    }
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, job, 'Job retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const getJobByIdController = async (req, res, next) => {
  try {
    const job = await JobService.getJobById(req.params.jobId);
    if (!job) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
    }
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, job, 'Job retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const updateJobController = async (req, res, next) => {
  try {
    const job = await JobService.updateJobById(req.params.jobId, req.body);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, job, 'Job updated successfully'));
  } catch (error) {
    next(error);
  }
};

const deleteJobController = async (req, res, next) => {
  try {
    await JobService.deleteJobById(req.params.jobId);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, null, 'Job deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const updateJobStatusController = async (req, res, next) => {
  try {
    const { status } = req.body;
    const job = await JobService.updateJobStatus(req.params.jobId, status);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, job, 'Job status updated successfully'));
  } catch (error) {
    next(error);
  }
};

export default {
  createJobController,
  getJobsController,
  getFeaturedJobsController,
  getJobController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
  updateJobStatusController,
};
