import Payment from './payment.model.js';
import { ApiError } from '../../utils/ApiError.js';

class PaymentService {
  static async create(payload) {
    const payment = await Payment.create(payload);
    return payment;
  }

  static async getAll({ page = 1, limit = 20, status = null } = {}) {
    const skip = (page - 1) * limit;
    const query = status ? { status } : {};
    const payments = await Payment.find(query)
      .populate('order')
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await Payment.countDocuments(query);
    return {
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getById(id) {
    const payment = await Payment.findById(id).populate('order');
    if (!payment) throw new ApiError('Payment not found', 404);
    return payment;
  }

  static async update(id, payload) {
    const payment = await Payment.findByIdAndUpdate(id, payload, { new: true });
    if (!payment) throw new ApiError('Payment not found', 404);
    return payment;
  }

  static async updatePaymentByTransactionId(transaction_id, payload) {
    const payment = await Payment.findOneAndUpdate({ transaction_id }, payload, { new: true });
    if (!payment) throw new ApiError('Payment not found for the given transaction ID', 404);
    return payment;
  }
}

export default PaymentService;
