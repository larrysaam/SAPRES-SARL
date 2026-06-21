import Payment from './payment.model.js';
import Order from '../orders/order.model.js';
import { ApiError } from '../../utils/ApiError.js';

class PaymentService {
  /**
   * Create a new payment record
   * @param {Object} payload - Payment data
   * @returns {Promise} Created payment
   */
  static async create(payload) {
    // Verify order exists
    if (payload.order) {
      const order = await Order.findById(payload.order);
      if (!order) {
        throw new ApiError('Order not found', 404);
      }
    }

    const payment = await Payment.create(payload);
    return payment.populate('order');
  }

  /**
   * Get all payments with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise} Payments with pagination
   */
  static async getAll({ page = 1, limit = 20, status = null, orderId = null } = {}) {
    const skip = (page - 1) * limit;
    const query = {};
    
    if (status) query.status = status;
    if (orderId) query.order = orderId;

    const payments = await Payment.find(query)
      .populate('order')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Payment.countDocuments(query);

    return {
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get payment by ID
   * @param {String} id - Payment ID
   * @returns {Promise} Payment document
   */
  static async getById(id) {
    const payment = await Payment.findById(id).populate('order');
    if (!payment) throw new ApiError('Payment not found', 404);
    return payment;
  }

  /**
   * Get payment by transaction ID
   * @param {String} transactionId - CAMERPAY transaction ID
   * @returns {Promise} Payment document
   */
  static async getByTransactionId(transactionId) {
    const payment = await Payment.findOne({ transactionId }).populate('order');
    if (!payment) throw new ApiError('Payment not found for the given transaction ID', 404);
    return payment;
  }

  /**
   * Update payment by ID
   * @param {String} id - Payment ID
   * @param {Object} payload - Update data
   * @returns {Promise} Updated payment
   */
  static async update(id, payload) {
    const payment = await Payment.findByIdAndUpdate(id, payload, { new: true }).populate('order');
    if (!payment) throw new ApiError('Payment not found', 404);
    return payment;
  }

  /**
   * Update payment by transaction ID
   * @param {String} transactionId - CAMERPAY transaction ID
   * @param {Object} payload - Update data
   * @returns {Promise} Updated payment
   */
  static async updateByTransactionId(transactionId, payload) {
    const payment = await Payment.findOneAndUpdate(
      { transactionId },
      payload,
      { new: true }
    ).populate('order');

    if (!payment) {
      throw new ApiError('Payment not found for the given transaction ID', 404);
    }

    // If payment is successful, update order status
    if (payload.status === 'successful') {
      if (payment.order) {
        await Order.findByIdAndUpdate(payment.order._id, {
          paymentStatus: 'paid',
          orderStatus: 'processing',
        });
      }
    }

    // If payment failed, update order status
    if (payload.status === 'failed') {
      if (payment.order) {
        await Order.findByIdAndUpdate(payment.order._id, {
          paymentStatus: 'failed',
        });
      }
    }

    return payment;
  }

  /**
   * Delete payment
   * @param {String} id - Payment ID
   * @returns {Promise} Deleted payment
   */
  static async delete(id) {
    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) throw new ApiError('Payment not found', 404);
    return payment;
  }

  /**
   * Get payments by order ID
   * @param {String} orderId - Order ID
   * @returns {Promise} Order payments
   */
  static async getByOrderId(orderId) {
    const payments = await Payment.find({ order: orderId })
      .populate('order')
      .sort({ createdAt: -1 });
    return payments;
  }

  /**
   * Check if order has successful payment
   * @param {String} orderId - Order ID
   * @returns {Promise<Boolean>}
   */
  static async hasSuccessfulPayment(orderId) {
    const payment = await Payment.findOne({
      order: orderId,
      status: 'successful',
    });
    return !!payment;
  }
}

export default PaymentService;
