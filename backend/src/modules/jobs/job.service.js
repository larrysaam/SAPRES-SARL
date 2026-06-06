import Job from './job.model.js';
import { ApiError } from '../../utils/ApiError.js';

class JobService {
  static async create(payload) {
    const job = await Job.create(payload);
    return job;
  }

  static async getAll({ page = 1, limit = 20, status = null } = {}) {
    const skip = (page - 1) * limit;
    const query = status ? { status } : {};
    const jobs = await Job.find(query)
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await Job.countDocuments(query);
    return {
      data: jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getById(id) {
    const job = await Job.findById(id);
    if (!job) throw new ApiError('Job not found', 404);
    return job;
  }

  static async update(id, payload) {
    const job = await Job.findByIdAndUpdate(id, payload, { new: true });
    if (!job) throw new ApiError('Job not found', 404);
    return job;
  }

  static async delete(id) {
    const job = await Job.findByIdAndDelete(id);
    if (!job) throw new ApiError('Job not found', 404);
    return job;
  }
}

export default JobService;
