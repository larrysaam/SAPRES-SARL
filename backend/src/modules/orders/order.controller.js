import OrderService from './order.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }
  next();
};

const createOrder = asyncHandler(async (req, res) => {
  const order = await OrderService.create(req.body);
  return new ApiResponse(httpStatus.CREATED, order, 'Order created successfully').send(res);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const orders = await OrderService.getAll({ page, limit, status });
  return new ApiResponse(httpStatus.OK, orders, 'Orders fetched successfully').send(res);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await OrderService.getById(req.params.id);
  return new ApiResponse(httpStatus.OK, order, 'Order fetched successfully').send(res);
});

const updateOrder = asyncHandler(async (req, res) => {
  const order = await OrderService.update(req.params.id, req.body);
  return new ApiResponse(httpStatus.OK, order, 'Order updated successfully').send(res);
});

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await OrderService.delete(req.params.id);
  return new ApiResponse(httpStatus.OK, order, 'Order deleted successfully').send(res);
});

export default {
  validate,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
