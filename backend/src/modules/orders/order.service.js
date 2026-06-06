import Order from './order.model.js';
import { ApiError } from '../../utils/ApiError.js';
import generateOrderNumber from '../../utils/generateOrderNumber.js';

class OrderService {
  static async create(payload) {
    payload.orderNumber = generateOrderNumber('ORD');
    const order = await Order.create(payload);
    return order;
  }

  static async getAll({ page = 1, limit = 20, status = null } = {}) {
    const skip = (page - 1) * limit;
    const query = status ? { orderStatus: status } : {};
    const orders = await Order.find(query)
      .populate('items.product')
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await Order.countDocuments(query);
    return {
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getById(id) {
    const order = await Order.findById(id).populate('items.product');
    if (!order) throw new ApiError('Order not found', 404);
    return order;
  }

  static async update(id, payload) {
    const order = await Order.findByIdAndUpdate(id, payload, { new: true });
    if (!order) throw new ApiError('Order not found', 404);
    return order;
  }

  static async delete(id) {
    const order = await Order.findByIdAndDelete(id);
    if (!order) throw new ApiError('Order not found', 404);
    return order;
  }
}

export default OrderService;
