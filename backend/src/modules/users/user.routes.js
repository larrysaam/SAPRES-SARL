import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import auth from '../../middlewares/auth.middleware.js';
import authorize from '../../middlewares/role.middleware.js';
import userValidation from './user.validation.js';
import userController from './user.controller.js';

const router = express.Router();

router
  .route('/')
  .post(auth(), authorize('super_admin'), validate(userValidation.createUser), userController.createUser)
  .get(auth(), authorize('super_admin'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(auth(), authorize('super_admin'), validate(userValidation.getUser), userController.getUser)
  .put(auth(), authorize('super_admin'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth(), authorize('super_admin'), validate(userValidation.deleteUser), userController.deleteUser);

router.patch(
  '/:userId/status',
  auth(),
  authorize('super_admin'),
  validate(userValidation.updateUserStatus),
  userController.updateUserStatus
);

export default router;
