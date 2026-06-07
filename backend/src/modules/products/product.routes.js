import express from 'express';
import auth from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import productValidation from './product.validation.js';
import productController from './product.controller.js';

const router = express.Router();

// Public routes
router.get('/', validate(productValidation.getProductsSchema), productController.getProductsController);
router.get('/featured', productController.getFeaturedProductsController);
router.get('/:slug', productController.getProductController);
router.get('/:slug/related', productController.getRelatedProductsController);

// Authenticated routes
router.use(auth); // Apply authentication middleware to all subsequent routes in this router

router.post(
  '/',
  authorize('super_admin', 'sales_admin'),
  validate(productValidation.createProductSchema),
  productController.createProductController
);

router
  .route('/:productId')
  .put(
    authorize('super_admin', 'sales_admin'),
    validate(productValidation.updateProductSchema),
    productController.updateProductController
  )
  .delete(authorize('super_admin', 'sales_admin'), productController.deleteProductController);

router.post(
  '/:productId/images',
  authorize('super_admin', 'sales_admin'),
  validate(productValidation.uploadProductImagesSchema),
  productController.uploadProductImagesController
);

router.delete(
  '/:productId/images/:publicId',
  authorize('super_admin', 'sales_admin'),
  productController.deleteProductImageController
);

router.post(
  '/:productId/datasheets',
  authorize('super_admin', 'sales_admin'),
  validate(productValidation.uploadDatasheetSchema),
  productController.uploadDatasheetController
);

export default router;
