import Product from './product.model.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';
import Category from '../categories/category.model.js';


/**
 * Create a product
 * @param {Object} productBody
 * @param {Object} user
 * @returns {Promise<Product>}
 */
const createProduct = async (productBody, user) => {
  const category = await Category.findById(productBody.category);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const product = await Product.create({
    ...productBody,
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug,
    },
    createdBy: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
  return product;
};

/**
 * Query for products
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProducts = async (filter, options) => {
  const { limit = 10, page = 1, sortBy, search, category, featured, status } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) {
    query['category._id'] = category;
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

  const products = await Product.find(query).sort(sort).skip(skip).limit(limit);
  const totalDocuments = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalDocuments,
    totalPages,
    data: products,
  };
};

/**
 * Get featured products
 * @returns {Promise<Product[]>}
 */
const getFeaturedProducts = async () => {
  const products = await Product.find({ featured: true, status: 'published' }).select(
    '_id name slug price discountPrice images'
  );
  return products;
};

/**
 * Get product by slug
 * @param {string} slug
 * @returns {Promise<Product>}
 */
const getProductBySlug = async (slug) => {
  return Product.findOne({ slug });
};

/**
 * Get product by id
 * @param {ObjectId} id
 * @returns {Promise<Product>}
 */
const getProductById = async (id) => {
  return Product.findById(id);
};

/**
 * Update product by id
 * @param {ObjectId} productId
 * @param {Object} updateBody
 * @returns {Promise<Product>}
 */
const updateProductById = async (productId, updateBody) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  if (updateBody.category) {
    const category = await Category.findById(updateBody.category);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    updateBody.category = {
      _id: category._id,
      name: category.name,
      slug: category.slug,
    };
  }
  Object.assign(product, updateBody);
  await product.save();
  return product;
};

/**
 * Delete product by id
 * @param {ObjectId} productId
 * @returns {Promise<Product>}
 */
const deleteProductById = async (productId) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  // Delete images from cloudinary
  for (const image of product.images) {
    await deleteFileFromCloudinary(image.publicId, 'image');
  }
  // Delete datasheets from cloudinary
  for (const datasheet of product.datasheets) {
    await deleteFileFromCloudinary(datasheet.publicId, 'raw');
  }

  await product.deleteOne();
  return product;
};

/**
 * Upload product images
 * @param {ObjectId} productId
 * @param {Array<Object>} files
 * @returns {Promise<Product>}
 */
const uploadProductImages = async (productId, images) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  product.images.push(...images);
  await product.save();
  return product;
};

/**
 * Delete product image
 * @param {ObjectId} productId
 * @param {string} publicId
 * @returns {Promise<Product>}
 */
const deleteProductImage = async (productId, publicId) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const imageIndex = product.images.findIndex((img) => img.publicId === publicId);
  if (imageIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Image not found');
  }

  await deleteFileFromCloudinary(publicId, 'image');
  product.images.splice(imageIndex, 1);
  await product.save();
  return product;
};

/**
 * Upload datasheet
 * @param {ObjectId} productId
 * @param {Object} file
 * @returns {Promise<Product>}
 */
const uploadDatasheet = async (productId, datasheet) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  // Delete existing datasheets from cloudinary
  for (const ds of product.datasheets) {
    await deleteFileFromCloudinary(ds.publicId, 'raw');
  }
  product.datasheets = []; // Clear existing datasheets

  product.datasheets.push(datasheet);
  await product.save();
  return product;
};

/**
 * Get related products
 * @param {string} slug
 * @returns {Promise<Product[]>}
 */
const getRelatedProducts = async (slug) => {
  const product = await getProductBySlug(slug);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const relatedProducts = await Product.find({
    'category._id': product.category._id,
    _id: { $ne: product._id }, // Exclude the current product
    status: 'published',
  })
    .limit(4) // Limit to a reasonable number of related products
    .select('_id name slug price discountPrice images');

  return relatedProducts;
};

export default {
  createProduct,
  queryProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  updateProductById,
  deleteProductById,
  uploadProductImages,
  deleteProductImage,
  uploadDatasheet,
  getRelatedProducts,
};
