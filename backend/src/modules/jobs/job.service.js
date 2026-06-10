
import Job from './job.model.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';

const createJob = async (jobBody) => {
  const job = await Job.create(jobBody);
  return job;
};

const queryJobs = async (filter, options) => {
  const {
    limit = 10,
    page = 1,
    sortBy,
    search,
    department,
    featured,
    status,
  } = options;
  const skip = (page - 1) * limit;

  // Build query from filter + extra options
  const query = { ...filter };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) {
    query.department = department;
  }
  if (featured !== undefined) {
    query.featured = featured === true || featured === 'true';
  }
  if (status) {
    query.status = status;
  }

  const sort = {};
  if (sortBy) {
    const parts = sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  const jobs = await Job.find(query).sort(sort).skip(skip).limit(limit);
  const totalDocuments = await Job.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalDocuments,
    totalPages,
    data: jobs,
  };
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
