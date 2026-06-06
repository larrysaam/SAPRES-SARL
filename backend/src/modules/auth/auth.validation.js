import Joi from 'joi';
import { objectId } from '../../utils/customValidation.js'; // Assuming customValidation.js will be created

const password = Joi.string()
  .required()
  .min(8)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/)
  .message('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.');

const register = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().required().email(),
  phone: Joi.string(),
  password: password,
  role: Joi.string().valid('super_admin', 'hr_admin', 'sales_admin', 'content_admin'),
});

const login = Joi.object().keys({
  email: Joi.string().required().email(),
  password: Joi.string().required(),
});

const logout = Joi.object().keys({
  refreshToken: Joi.string().required(),
});

const refreshTokens = Joi.object().keys({
  refreshToken: Joi.string().required(),
});

const forgotPassword = Joi.object().keys({
  email: Joi.string().email().required(),
});

const resetPassword = Joi.object().keys({
  token: Joi.string().required(),
  password: password,
});

const changePassword = Joi.object().keys({
  currentPassword: Joi.string().required(),
  newPassword: password,
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Confirm password does not match new password',
  }),
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
};
