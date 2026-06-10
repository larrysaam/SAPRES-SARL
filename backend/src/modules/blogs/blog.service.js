import Blog from './blog.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { deleteFileFromCloudinary } from '../../utils/cloudinary.util.js';

class BlogService {
  static async create(payload, userId) {
    const existingBlog = await Blog.findOne({ title: payload.title });
    if (existingBlog) throw new ApiError(400, 'Blog title already exists');
    
    payload.author = userId;
    const blog = await Blog.create(payload);
    return blog;
  }

  static async getAll({ page = 1, limit = 12, category = null, featured = null, search = null, tag = null, sort = 'newest' } = {}) {
    const skip = (page - 1) * limit;
    const query = { status: 'published', deletedAt: { $exists: false } };

    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    if (tag) query.tags = { $in: [tag] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOption = sort === 'newest' ? { publishedAt: -1 } : { views: -1 };

    const blogs = await Blog.find(query)
      .populate('author', 'firstName lastName')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Blog.countDocuments(query);

    return {
      data: blogs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getBySlug(slug) {
    const blog = await Blog.findOne({ slug, status: 'published', deletedAt: { $exists: false } })
      .populate('author', 'firstName lastName')
      .lean();
    if (!blog) throw new ApiError(404, 'Blog post not found');
    return blog;
  }

  static async getById(id) {
    const blog = await Blog.findById(id)
      .populate('author', 'firstName lastName')
      .lean();
    if (!blog) throw new ApiError(404, 'Blog post not found');
    return blog;
  }

  static async update(id, payload) {
    const blog = await Blog.findByIdAndUpdate(id, payload, { new: true })
      .populate('author', 'firstName lastName');
    if (!blog) throw new ApiError(404, 'Blog post not found');
    return blog;
  }

  static async delete(id) {
    const blog = await Blog.findById(id);
    if (!blog) throw new ApiError(404, 'Blog post not found');

    // Delete featured image from Cloudinary
    if (blog.featuredImage && blog.featuredImage.publicId) {
      await deleteFileFromCloudinary(blog.featuredImage.publicId, 'image');
    }

    // Delete gallery images from Cloudinary
    if (blog.gallery && blog.gallery.length > 0) {
      for (const image of blog.gallery) {
        if (image.publicId) {
          await deleteFileFromCloudinary(image.publicId, 'image');
        }
      }
    }

    await blog.deleteOne(); // Permanently delete the blog
    return blog;
  }

  static async uploadFeaturedImage(id, imageData) {
    const blog = await Blog.findByIdAndUpdate(
      id,
      { featuredImage: imageData },
      { new: true }
    );
    if (!blog) throw new ApiError(404, 'Blog post not found');
    return blog;
  }

  static async uploadGallery(id, images) {
    const blog = await Blog.findById(id);
    if (!blog) throw new ApiError(404, 'Blog post not found');
    
    if (!blog.gallery) blog.gallery = [];
    blog.gallery.push(...images);
    await blog.save();
    return blog;
  }

  static async deleteGalleryImage(blogId, imagePublicId) {
    const blog = await Blog.findByIdAndUpdate(
      blogId,
      { $pull: { gallery: { publicId: imagePublicId } } },
      { new: true }
    );
    if (!blog) throw new ApiError(404, 'Blog post not found');
    return blog;
  }

  static async getFeatured(limit = 10) {
    const blogs = await Blog.find({ featured: true, status: 'published', deletedAt: { $exists: false } })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('title slug excerpt featuredImage publishedAt')
      .lean();
    return blogs;
  }

  static async getRelated(slug, limit = 5) {
    const currentBlog = await Blog.findOne({ slug });
    if (!currentBlog) throw new ApiError(404, 'Blog post not found');

    const relatedBlogs = await Blog.find({
      $and: [
        { _id: { $ne: currentBlog._id } },
        { status: 'published' },
        { deletedAt: { $exists: false } },
        {
          $or: [
            { category: currentBlog.category },
            { tags: { $in: currentBlog.tags } }
          ]
        }
      ]
    })
      .limit(limit)
      .select('title slug excerpt featuredImage')
      .lean();

    return relatedBlogs;
  }

  static async incrementViews(id) {
    const blog = await Blog.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!blog) throw new ApiError(404, 'Blog post not found');
    return blog;
  }

  static async search(query) {
    const results = await Blog.find(
      {
        $text: { $search: query },
        status: 'published',
        deletedAt: { $exists: false }
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .select('title slug excerpt featuredImage')
      .lean();

    return results;
  }

  static async getStats() {
    const totalPosts = await Blog.countDocuments({ deletedAt: { $exists: false } });
    const publishedPosts = await Blog.countDocuments({ status: 'published', deletedAt: { $exists: false } });
    const draftPosts = await Blog.countDocuments({ status: 'draft', deletedAt: { $exists: false } });
    const archivedPosts = await Blog.countDocuments({ status: 'archived', deletedAt: { $exists: false } });
    
    const totalViews = (await Blog.aggregate([
      { $match: { deletedAt: { $exists: false } } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]))[0]?.totalViews || 0;

    const featuredPosts = await Blog.countDocuments({ featured: true, status: 'published', deletedAt: { $exists: false } });

    const mostViewedPost = (await Blog.findOne(
      { status: 'published', deletedAt: { $exists: false } },
      { title: 1, views: 1 }
    ).sort({ views: -1 }).lean());

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalViews,
      featuredPosts,
      mostViewedPost: mostViewedPost || null
    };
  }
}

export default BlogService;
