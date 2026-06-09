import express from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import categoryValidation from './category.validation.js';
import categoryController from './category.controller.js';

const router = express.Router();

// Public routes
router.get('/', validate(categoryValidation.getCategoriesSchema), categoryController.getCategoriesController);
router.get('/featured', categoryController.getFeaturedCategoriesController);
router.get('/:slug', categoryController.getCategoryController);
router.get('/:slug/products', categoryController.getCategoryProductsController);

// Authenticated routes
router.use(auth());

router.post(
  '/',
  authorize('super_admin', 'sales_admin'),
  validate(categoryValidation.createCategorySchema),
  categoryController.createCategoryController
);

router
  .route('/:categoryId')
  .put(
    authorize('super_admin', 'sales_admin'),
    validate(categoryValidation.updateCategorySchema),
    categoryController.updateCategoryController
  )
  .delete(authorize('super_admin'), categoryController.deleteCategoryController);

router.post(
  '/:categoryId/image',
  authorize('super_admin', 'sales_admin'),
  categoryController.uploadCategoryImageController
);

router.post(
  '/:categoryId/icon',
  authorize('super_admin', 'sales_admin'),
  categoryController.uploadCategoryIconController
);

export default router;
