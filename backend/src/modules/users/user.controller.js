import httpStatus from 'http-status';
import userService from './user.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

const createUser = async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, user, 'User created successfully'));
};

const getUsers = async (req, res) => {
  const filter = {};
  if (req.query.firstName) filter.firstName = req.query.firstName;
  if (req.query.lastName) filter.lastName = req.query.lastName;
  if (req.query.email) filter.email = req.query.email;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive) filter.isActive = req.query.isActive;

  const options = {
    sortBy: req.query.sortBy,
    limit: parseInt(req.query.limit, 10) || 10,
    page: parseInt(req.query.page, 10) || 1,
  };

  const result = await userService.queryUsers(filter, options);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, result.data, 'Users retrieved successfully', result.page, result.limit, result.totalDocuments, result.totalPages));
};

const getUser = async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, user, 'User retrieved successfully'));
};

const updateUser = async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, user, 'User updated successfully'));
};

const updateUserStatus = async (req, res) => {
  const user = await userService.updateUserStatusById(req.params.userId, req.body.isActive);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, user, 'User status updated successfully'));
};

const deleteUser = async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'User deleted successfully'));
};

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
