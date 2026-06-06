import JobService from './job.service.js';
import ApiResponse from '../../utils/ApiResponse.js';

class JobController {
  static async getAll(req, res, next) {
    try {
      const { page, limit, featured, status, department, search } = req.query;
      const result = await JobService.getAll({ page, limit, featured, status, department, search });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getBySlug(req, res, next) {
    try {
      const job = await JobService.getBySlug(req.params.slug);
      res.json(ApiResponse.success(job));
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const job = await JobService.getById(req.params.id);
      res.json(ApiResponse.success(job));
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const job = await JobService.create(req.body);
      res.status(201).json(ApiResponse.success(job, 'Job created successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const job = await JobService.update(req.params.id, req.body);
      res.json(ApiResponse.success(job, 'Job updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      await JobService.delete(req.params.id);
      res.json(ApiResponse.success(null, 'Job deleted successfully'));
    } catch (err) {
      next(err);
    }
  }
}

export default JobController;
