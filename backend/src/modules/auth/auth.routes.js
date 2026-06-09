import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import authValidation from './auth.validation.js';
import authController from './auth.controller.js';
import auth from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh-token', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.get('/me', auth(), authController.me);
router.put('/change-password', auth(), validate(authValidation.changePassword), authController.changePassword);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/add-admin', validate(authValidation.addAdmin), authController.addAdmin);

export default router;
