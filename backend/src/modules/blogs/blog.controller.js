import httpStatus from 'http-status';
import BlogService from './blog.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

class BlogController {
  static async getAll(req, res, next) {
    try {
      const { page, limit, category, featured, search, tag, sort } = req.query;
      const result = await BlogService.getAll({ page, limit, category, featured, search, tag, sort });
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, result, 'Blogs retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getBySlug(req, res, next) {
    try {
      const blog = await BlogService.getBySlug(req.params.slug);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, blog, 'Blog retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const blog = await BlogService.getById(req.params.id);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, blog, 'Blog retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const blog = await BlogService.create(req.body, req.user.id);
      res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, blog, 'Blog created successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const blog = await BlogService.update(req.params.id, req.body);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, blog, 'Blog updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      await BlogService.delete(req.params.id);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, null, 'Blog deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async uploadFeaturedImage(req, res, next) {
    try {
      const { featuredImage } = req.body;
      if (!featuredImage || !featuredImage.secure_url || !featuredImage.public_id) {
        throw new Error('No featured image data provided');
      }
      
      await BlogService.uploadFeaturedImage(req.params.id, featuredImage);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, featuredImage, 'Featured image uploaded successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async uploadGallery(req, res, next) {
    try {
      const { images } = req.body;
      if (!images || images.length === 0) throw new Error('No image data provided');
      
      await BlogService.uploadGallery(req.params.id, images);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, images, 'Gallery uploaded successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async deleteGalleryImage(req, res, next) {
    try {
      const { blogId, imageId } = req.params;
      await BlogService.deleteGalleryImage(blogId, imageId);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, null, 'Image deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getFeatured(req, res, next) {
    try {
      const limit = req.query.limit || 10;
      const blogs = await BlogService.getFeatured(limit);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, blogs, 'Featured blogs retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getRelated(req, res, next) {
    try {
      const limit = req.query.limit || 5;
      const blogs = await BlogService.getRelated(req.params.slug, limit);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, blogs, 'Related blogs retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async incrementViews(req, res, next) {
    try {
      await BlogService.incrementViews(req.params.id);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, null, 'View recorded successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async search(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) throw new Error('Search query required');
      const results = await BlogService.search(q);
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, results, 'Search results'));
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await BlogService.getStats();
      res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, stats, 'Blog stats retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}

export default BlogController;
