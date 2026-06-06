const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const upload = require('../../middlewares/upload.middleware');
const productValidation = require('./product.validation');
const productController = require('./product.controller');

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
  authorize(['super_admin', 'sales_admin']),
  validate(productValidation.createProductSchema),
  productController.createProductController
);

router
  .route('/:productId')
  .put(
    authorize(['super_admin', 'sales_admin']),
    validate(productValidation.updateProductSchema),
    productController.updateProductController
  )
  .delete(authorize(['super_admin', 'sales_admin']), productController.deleteProductController);

router.post(
  '/:productId/images',
  authorize(['super_admin', 'sales_admin']),
  upload.array('images', 10), // Max 10 images
  validate(productValidation.uploadProductImagesSchema),
  productController.uploadProductImagesController
);

router.delete(
  '/:productId/images/:publicId',
  authorize(['super_admin', 'sales_admin']),
  productController.deleteProductImageController
);

router.post(
  '/:productId/datasheets',
  authorize(['super_admin', 'sales_admin']),
  upload.single('datasheet'),
  validate(productValidation.uploadDatasheetSchema),
  productController.uploadDatasheetController
);

module.exports = router;