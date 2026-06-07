import BlogService from './blog.service.js';
import {ApiResponse} from '../../utils/ApiResponse.js';
import cloudinary from '../../config/cloudinary.js';

class BlogController {
  static async getAll(req, res, next) {
    try {
      const { page, limit, category, featured, search, tag, sort } = req.query;
      const result = await BlogService.getAll({ page, limit, category, featured, search, tag, sort });
      res.json(ApiResponse.success(result, 'Blogs retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getBySlug(req, res, next) {
    try {
      const blog = await BlogService.getBySlug(req.params.slug);
      res.json(ApiResponse.success(blog));
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const blog = await BlogService.getById(req.params.id);
      res.json(ApiResponse.success(blog));
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const blog = await BlogService.create(req.body, req.user.id);
      res.status(201).json(ApiResponse.success(blog, 'Blog created successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const blog = await BlogService.update(req.params.id, req.body);
      res.json(ApiResponse.success(blog, 'Blog updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      await BlogService.delete(req.params.id);
      res.json(ApiResponse.success(null, 'Blog deleted successfully'));
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
      
      const blog = await BlogService.uploadFeaturedImage(req.params.id, featuredImage);
      res.json(ApiResponse.success(featuredImage, 'Featured image uploaded successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async uploadGallery(req, res, next) {
    try {
      const { images } = req.body;
      if (!images || images.length === 0) throw new Error('No image data provided');
      
      await BlogService.uploadGallery(req.params.id, images);
      res.json(ApiResponse.success(images, 'Gallery uploaded successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async deleteGalleryImage(req, res, next) {
    try {
      const { blogId, imageId } = req.params;
      await BlogService.deleteGalleryImage(blogId, imageId);
      res.json(ApiResponse.success(null, 'Image deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getFeatured(req, res, next) {
    try {
      const limit = req.query.limit || 10;
      const blogs = await BlogService.getFeatured(limit);
      res.json(ApiResponse.success(blogs));
    } catch (err) {
      next(err);
    }
  }

  static async getRelated(req, res, next) {
    try {
      const limit = req.query.limit || 5;
      const blogs = await BlogService.getRelated(req.params.slug, limit);
      res.json(ApiResponse.success(blogs));
    } catch (err) {
      next(err);
    }
  }

  static async incrementViews(req, res, next) {
    try {
      await BlogService.incrementViews(req.params.id);
      res.json(ApiResponse.success(null, 'View recorded successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async search(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) throw new Error('Search query required');
      const results = await BlogService.search(q);
      res.json(ApiResponse.success(results));
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await BlogService.getStats();
      res.json(ApiResponse.success(stats));
    } catch (err) {
      next(err);
    }
  }
}

export default BlogController;
