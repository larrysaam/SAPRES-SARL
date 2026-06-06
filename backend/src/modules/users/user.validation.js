import Joi from 'joi';
import { objectId, password } from '../../utils/customValidation.js';

const createUser = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().required().email(),
  phone: Joi.string(),
  password: Joi.custom(password).required(),
  role: Joi.string().valid('super_admin', 'hr_admin', 'sales_admin', 'content_admin').required(),
});

const getUsers = Joi.object().keys({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  role: Joi.string().valid('super_admin', 'hr_admin', 'sales_admin', 'content_admin'),
  isActive: Joi.boolean(),
  sortBy: Joi.string(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

const getUser = Joi.object().keys({
  userId: Joi.string().custom(objectId),
});

const updateUser = Joi.object().keys({
  userId: Joi.required().custom(objectId),
  firstName: Joi.string(),
  lastName: Joi.string(),
  phone: Joi.string(),
  role: Joi.string().valid('super_admin', 'hr_admin', 'sales_admin', 'content_admin'),
  isActive: Joi.boolean(),
});

const updateUserStatus = Joi.object().keys({
  userId: Joi.required().custom(objectId),
  isActive: Joi.boolean().required(),
});

const deleteUser = Joi.object().keys({
  userId: Joi.string().custom(objectId),
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
