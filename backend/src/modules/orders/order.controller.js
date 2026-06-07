import OrderService from './order.service.js';
import { SuccessResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

class OrderController {
  static createOrder = asyncHandler(async (req, res) => {
    const order = await OrderService.create(req.body);
    return new SuccessResponse("Order created successfully", order).send(res);
  });

  static getAllOrders = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const orders = await OrderService.getAll({ page, limit, status });
    return new SuccessResponse("Orders fetched successfully", orders).send(res);
  });

  static getOrderById = asyncHandler(async (req, res) => {
    const order = await OrderService.getById(req.params.id);
    return new SuccessResponse("Order fetched successfully", order).send(res);
  });

  static updateOrder = asyncHandler(async (req, res) => {
    const order = await OrderService.update(req.params.id, req.body);
    return new SuccessResponse("Order updated successfully", order).send(res);
  });

  static deleteOrder = asyncHandler(async (req, res) => {
    const order = await OrderService.delete(req.params.id);
    return new SuccessResponse("Order deleted successfully", order).send(res);
  });
}

export default OrderController;