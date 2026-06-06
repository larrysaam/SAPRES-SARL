const httpStatus = require('http-status');
const { categoryService } = require('../services');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

const createCategoryController = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body, req.user);
    res
      .status(httpStatus.CREATED)
      .send(new ApiResponse(httpStatus.CREATED, 'Category created successfully', category));
  } catch (error) {
    next(error);
  }
};

const getCategoriesController = async (req, res, next) => {
  try {
    const filter = {};
    const options = {
      limit: req.query.limit,
      page: req.query.page,
      sortBy: req.query.sort ? `${req.query.sort}:${req.query.order || 'asc'}` : undefined,
      search: req.query.search,
      featured: req.query.featured,
      status: req.query.status,
    };
    const result = await categoryService.queryCategories(filter, options);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, 'Categories retrieved successfully', result.data, {
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

const getFeaturedCategoriesController = async (req, res, next) => {
  try {
    const categories = await categoryService.getFeaturedCategories();
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Featured categories retrieved successfully', categories));
  } catch (error) {
    next(error);
  }
};

const getCategoryController = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Category retrieved successfully', category));
  } catch (error) {
    next(error);
  }
};

const getCategoryProductsController = async (req, res, next) => {
  try {
    const options = {
      limit: req.query.limit,
      page: req.query.page,
      sortBy: req.query.sort ? `${req.query.sort}:${req.query.order || 'asc'}` : undefined,
    };
    const result = await categoryService.getCategoryProducts(req.params.slug, options);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(
          httpStatus.OK,
          'Category products retrieved successfully',
          result.data,
          {
            page: result.page,
            limit: result.limit,
            totalDocuments: result.totalDocuments,
            totalPages: result.totalPages,
            category: result.category,
          }
        )
      );
  } catch (error) {
    next(error);
  }
};

const updateCategoryController = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategoryById(req.params.categoryId, req.body);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Category updated successfully', category));
  } catch (error) {
    next(error);
  }
};

const deleteCategoryController = async (req, res, next) => {
  try {
    await categoryService.deleteCategoryById(req.params.categoryId);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Category deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const uploadCategoryImageController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Category image file is required');
    }
    const category = await categoryService.uploadCategoryImage(req.params.categoryId, req.file);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, 'Category image uploaded successfully', {
          image: category.image,
        })
      );
  } catch (error) {
    next(error);
  }
};

const uploadCategoryIconController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Category icon file is required');
    }
    const category = await categoryService.uploadCategoryIcon(req.params.categoryId, req.file);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, 'Category icon uploaded successfully', { icon: category.icon })
      );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategoryController,
  getCategoriesController,
  getFeaturedCategoriesController,
  getCategoryController,
  getCategoryProductsController,
  updateCategoryController,
  deleteCategoryController,
  uploadCategoryImageController,
  uploadCategoryIconController,
};
