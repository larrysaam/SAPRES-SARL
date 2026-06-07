import httpStatus from 'http-status';
import productService from './product.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const createProductController = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user);
    res
      .status(httpStatus.CREATED)
      .send(new ApiResponse(httpStatus.CREATED, product, 'Product created successfully'));
  } catch (error) {
    next(error);
  }
};

const getProductsController = async (req, res, next) => {
  try {
    const filter = {};
    const options = {
      limit: req.query.limit,
      page: req.query.page,
      sortBy: req.query.sort ? req.query.sort : undefined,
      search: req.query.search,
      category: req.query.category,
      featured: req.query.featured,
      status: req.query.status,
    };
    const result = await productService.queryProducts(filter, options);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, result.data, 'Products retrieved successfully', result.page, result.limit, result.totalDocuments, result.totalPages)
      );
  } catch (error) {
    next(error);
  }
};

const getFeaturedProductsController = async (req, res, next) => {
  try {
    const products = await productService.getFeaturedProducts();
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, products, 'Featured products retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const getProductController = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, product, 'Product retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const updateProductController = async (req, res, next) => {
  try {
    const product = await productService.updateProductById(req.params.productId, req.body);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, product, 'Product updated successfully'));
  } catch (error) {
    next(error);
  }
};

const deleteProductController = async (req, res, next) => {
  try {
    await productService.deleteProductById(req.params.productId);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, null, 'Product deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const uploadProductImagesController = async (req, res, next) => {
  try {
    const { images } = req.body;
    if (!images || images.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No image data provided');
    }
    const product = await productService.uploadProductImages(req.params.productId, images);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, { images: product.images }, 'Images uploaded successfully')
      );
  } catch (error) {
    next(error);
  }
};

const deleteProductImageController = async (req, res, next) => {
  try {
    await productService.deleteProductImage(req.params.productId, req.params.publicId);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, null, 'Image deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const uploadDatasheetController = async (req, res, next) => {
  try {
    const { datasheet } = req.body;
    if (!datasheet || !datasheet.secure_url || !datasheet.public_id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No datasheet data provided');
    }
    const product = await productService.uploadDatasheet(req.params.productId, datasheet);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, { datasheet: product.datasheets[0] }, 'Datasheet uploaded successfully')
      );
  } catch (error) {
    next(error);
  }
};

const getRelatedProductsController = async (req, res, next) => {
  try {
    const products = await productService.getRelatedProducts(req.params.slug);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, products, 'Related products retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export default {
  createProductController,
  getProductsController,
  getFeaturedProductsController,
  getProductController,
  updateProductController,
  deleteProductController,
  uploadProductImagesController,
  deleteProductImageController,
  uploadDatasheetController,
  getRelatedProductsController,
};
