import httpStatus from 'http-status'; // Import http-status
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

/**
 * Create Order
 * POST /api/v1/orders
 * 
 * Supports both registered users and guest checkouts
 * 
 * SECURITY: Frontend sends ONLY productId + quantity
 * Backend calculates all prices and totals
 * 
 * Request Body:
 * {
 *   "items": [
 *     { "productId": "...", "quantity": 2 },
 *     { "productId": "...", "quantity": 1 }
 *   ],
 *   "shippingAddress": {
 *     "fullName": "Jean Dupont",
 *     "phone": "699123456",
 *     "email": "jean@example.cm",
 *     "address": "123 Rue Main",
 *     "city": "Douala",
 *     "postalCode": "28000",
 *     "country": "Cameroon"
 *   }
 * }
 */
const createOrder = asyncHandler(async (req, res) => {
  console.log('Creating order with request body:', req.body);
  const { items, shippingAddress } = req.body;
  const userId = req.user?._id || null; // Optional for guest checkout

  // Validate items structure
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError('Order must contain at least one item', httpStatus.BAD_REQUEST);
  }

  // SECURITY: Reject if frontend tries to send prices
  for (const item of items) {
    if (item.price || item.unitPrice || item.totalPrice || item.subtotal) {
      throw new ApiError(
        'Frontend cannot specify product prices. Security violation detected.',
        httpStatus.BAD_REQUEST
      );
    }
  }

  // Call service with secure backend calculation
  const order = await OrderService.createOrder(userId, items, shippingAddress);

  return new ApiResponse(
    httpStatus.CREATED,
    order,
    'Order created successfully. Next: Initiate payment'
  ).send(res);
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
