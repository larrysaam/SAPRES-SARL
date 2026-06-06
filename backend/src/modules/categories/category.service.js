import Category from './category.model.js';
import { ApiError } from '../../utils/ApiError.js';
import cloudinary from '../../config/cloudinary.js';
import httpStatus from 'http-status';
import Product from '../products/product.model.js'; // To check for products before deleting a category

/**
 * Create a category
 * @param {Object} categoryBody
 * @param {Object} user
 * @returns {Promise<Category>}
 */
const createCategory = async (categoryBody, user) => {
  if (await Category.isNameTaken(categoryBody.name)) {
    throw new ApiError(httpStatus.CONFLICT, 'Category name already taken');
  }
  const category = await Category.create({
    ...categoryBody,
    createdBy: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
  return category;
};

/**
 * Query for categories
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCategories = async (filter, options) => {
  const { limit = 10, page = 1, sortBy, search, featured, status } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
    ];
  }
  if (featured) {
    query.featured = featured;
  }
  if (status) {
    query.status = status;
  }

  const sort = {};
  if (sortBy) {
    const parts = sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1; // Default sort
  }

  const categories = await Category.find(query).sort(sort).skip(skip).limit(limit);
  const totalDocuments = await Category.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalDocuments,
    totalPages,
    data: categories,
  };
};

/**
 * Get featured categories
 * @returns {Promise<Category[]>}
 */
const getFeaturedCategories = async () => {
  const categories = await Category.find({ featured: true, status: 'active' }).select(
    '_id name slug productCount image'
  );
  return categories;
};

/**
 * Get category by slug
 * @param {string} slug
 * @returns {Promise<Category>}
 */
const getCategoryBySlug = async (slug) => {
  return Category.findOne({ slug });
};

/**
 * Get category by id
 * @param {ObjectId} id
 * @returns {Promise<Category>}
 */
const getCategoryById = async (id) => {
  return Category.findById(id);
};

/**
 * Get products for a category
 * @param {string} slug - Category slug
 * @param {Object} options - Query options for products
 * @returns {Promise<Object>}
 */
const getCategoryProducts = async (slug, options) => {
  const category = await getCategoryBySlug(slug);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  const query = { 'category._id': category._id, status: 'published' };

  const sort = {};
  if (sortBy) {
    const parts = sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1; // Default sort
  }

  const products = await Product.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('_id name slug price discountPrice stock featured images');
  const totalDocuments = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalDocuments,
    totalPages,
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug,
    },
    data: products,
  };
};

/**
 * Update category by id
 * @param {ObjectId} categoryId
 * @param {Object} updateBody
 * @returns {Promise<Category>}
 */
const updateCategoryById = async (categoryId, updateBody) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  if (updateBody.name && (await Category.isNameTaken(updateBody.name, categoryId))) {
    throw new ApiError(httpStatus.CONFLICT, 'Category name already taken');
  }
  Object.assign(category, updateBody);
  await category.save();
  return category;
};

/**
 * Delete category by id
 * @param {ObjectId} categoryId
 * @returns {Promise<Category>}
 */
const deleteCategoryById = async (categoryId) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const productCount = await Product.countDocuments({ 'category._id': categoryId });
  if (productCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete category with existing products');
  }

  // Delete image from cloudinary
  if (category.image && category.image.publicId) {
    await cloudinary.uploader.destroy(category.image.publicId);
  }
  // Delete icon from cloudinary
  if (category.icon && category.icon.publicId) {
    await cloudinary.uploader.destroy(category.icon.publicId);
  }

  await category.deleteOne();
  return category;
};

/**
 * Upload category image
 * @param {ObjectId} categoryId
 * @param {Object} file
 * @returns {Promise<Category>}
 */
const uploadCategoryImage = async (categoryId, file) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  if (category.image && category.image.publicId) {
    await cloudinary.uploader.destroy(category.image.publicId);
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: `sapres/categories/${categoryId}`,
    public_id: 'image',
    resource_type: 'image',
  });

  category.image = {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    originalName: file.originalname,
    format: result.format,
    bytes: result.bytes,
    resourceType: result.resource_type,
  };
  await category.save();
  return category;
};

/**
 * Upload category icon
 * @param {ObjectId} categoryId
 * @param {Object} file
 * @returns {Promise<Category>}
 */
const uploadCategoryIcon = async (categoryId, file) => {
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  if (category.icon && category.icon.publicId) {
    await cloudinary.uploader.destroy(category.icon.publicId);
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: `sapres/categories/${categoryId}`,
    public_id: 'icon',
    resource_type: 'image',
  });

  category.icon = {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    originalName: file.originalname,
    format: result.format,
    bytes: result.bytes,
    resourceType: result.resource_type,
  };
  await category.save();
  return category;
};

export default {
  createCategory,
  queryCategories,
  getFeaturedCategories,
  getCategoryBySlug,
  getCategoryById,
  getCategoryProducts,
  updateCategoryById,
  deleteCategoryById,
  uploadCategoryImage,
  uploadCategoryIcon,
};