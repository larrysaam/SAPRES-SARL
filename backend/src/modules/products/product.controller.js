const httpStatus = require('http-status');
const { productService } = require('../services');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

const createProductController = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user);
    res
      .status(httpStatus.CREATED)
      .send(new ApiResponse(httpStatus.CREATED, 'Product created successfully', product));
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
      sortBy: req.query.sort ? `${req.query.sort}:${req.query.order || 'asc'}` : undefined,
      search: req.query.search,
      category: req.query.category,
      featured: req.query.featured,
      status: req.query.status,
    };
    const result = await productService.queryProducts(filter, options);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, 'Products retrieved successfully', result.data, {
          page: result.page,
          limit: result.limit,
          totalDocuments: result.totalDocuments,
          totalPages: result.totalPages,
        })
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
      .send(new ApiResponse(httpStatus.OK, 'Featured products retrieved successfully', products));
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
      .send(new ApiResponse(httpStatus.OK, 'Product retrieved successfully', product));
  } catch (error) {
    next(error);
  }
};

const updateProductController = async (req, res, next) => {
  try {
    const product = await productService.updateProductById(req.params.productId, req.body);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Product updated successfully', product));
  } catch (error) {
    next(error);
  }
};

const deleteProductController = async (req, res, next) => {
  try {
    await productService.deleteProductById(req.params.productId);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Product deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const uploadProductImagesController = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No image files provided');
    }
    const product = await productService.uploadProductImages(req.params.productId, req.files);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, 'Images uploaded successfully', { images: product.images })
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
      .send(new ApiResponse(httpStatus.OK, 'Image deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const uploadDatasheetController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No datasheet file provided');
    }
    const product = await productService.uploadDatasheet(req.params.productId, req.file);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, 'Datasheet uploaded successfully', {
          datasheet: product.datasheets[0],
        })
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
      .send(new ApiResponse(httpStatus.OK, 'Related products retrieved successfully', products));
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
