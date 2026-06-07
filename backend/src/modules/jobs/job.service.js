
import Job from './job.model.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';

const createJob = async (jobBody) => {
  const job = await Job.create(jobBody);
  return job;
};

const queryJobs = async (filter, options) => {
  const jobs = await Job.paginate(filter, options);
  return jobs;
};

const getJobBySlug = async (slug) => {
  const job = await Job.findOne({ slug, deletedAt: { $exists: false } });
  return job;
};

const getJobById = async (id) => {
  const job = await Job.findById(id);
  return job;
};

const updateJobById = async (jobId, updateBody) => {
  const job = await getJobById(jobId);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }
  Object.assign(job, updateBody);
  await job.save();
  return job;
};

const deleteJobById = async (jobId) => {
  const job = await getJobById(jobId);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }
  job.deletedAt = new Date();
  await job.save();
  return job;
};

const getFeaturedJobs = async () => {
  const jobs = await Job.find({ featured: true, deletedAt: { $exists: false } }).limit(5);
  return jobs;
};

const updateJobStatus = async (jobId, status) => {
  const job = await getJobById(jobId);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }
  job.status = status;
  await job.save();
  return job;
};

export default {
  createJob,
  queryJobs,
  getJobBySlug,
  getJobById,
  updateJobById,
  deleteJobById,
  getFeaturedJobs,
  updateJobStatus,
};
