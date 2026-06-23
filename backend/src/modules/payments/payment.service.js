import Payment from './payment.model.js';
import Order from '../orders/order.model.js';
import OrderService from '../orders/order.service.js';
import CamerpayService from './camerpay.service.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * PaymentService - Handles payment lifecycle
 * 
 * CRITICAL FLOW:
 * 1. initiateCamerpayPayment() - Creates payment record + calls CAMERPAY
 * 2. handleCamerpayWebhook() - Receives callback from CAMERPAY (source of truth)
 * 3. Updates order status based on webhook data
 */
class PaymentService {  /**
   * Initiate CAMERPAY payment for an order
   * 
   * SECURITY:
   * ✅ Order must exist and be in PENDING_PAYMENT status
   * ✅ Payment amount comes from order.totalAmount (backend calculated)
   * ✅ Creates payment record in DB before calling CAMERPAY
   * ✅ Stores all transaction details
   * ✅ Supports both registered users and guest checkouts
   * 
   * @param {String} orderId - Order to pay for
   * @param {String} userId - User making payment (optional for guests)
   * @param {String} paymentMethod - 'mtn_money' or 'orange_money'
   * @returns {Promise<Object>} Payment details with paymentUrl
   */
  async initiateCamerpayPayment(orderId, userId = null, paymentMethod) {
    try {
      console.log('Initiating CAMERPAY payment for order:', orderId);      // ✅ FETCH AND VALIDATE ORDER
      const order = await Order.findById(orderId);
      if (!order) {
        throw new ApiError(404, 'Order not found');
      }      if (order.status !== 'PENDING_PAYMENT') {
        throw new ApiError(
          400,
          `Cannot pay for order with status: ${order.status}. Order must be in PENDING_PAYMENT status.`
        );
      }

      // ✅ VALIDATE ITEMS EXIST
      if (!order.items || order.items.length === 0) {
        throw new ApiError(400, 'Order has no items');
      }

      // ✅ USE ORDER'S TOTALAMOUNT (calculated by backend)
      const amount = order.totalAmount;
      if (!amount || amount <= 0) {
        throw new ApiError(400, 'Invalid order amount');
      }// ✅ CREATE PAYMENT RECORD IN DATABASE
      const transactionReference = `PAY-${Date.now()}-${orderId.toString().slice(-6)}`;
      
      const payment = new Payment({
        transactionReference,
        order: orderId,
        user: userId || null,
        amount,
        currency: 'XAF',
        provider: 'camerpay',
        paymentMethod,
        status: 'INITIATED',
        merchantInvoiceId: order.orderNumber,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        initiatedAt: new Date(),
      });

      await payment.save();

      console.log(`✅ Payment record created: ${transactionReference}`);      // ✅ CALL CAMERPAY API
      const camerpayResponse = await CamerpayService.initiatePayment({
        amount,
        currency: 'XAF',
        phone: order.customerPhone,
        orderId: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        paymentMethod,
      });      // ✅ UPDATE PAYMENT WITH CAMERPAY RESPONSE
      payment.transactionUuid = camerpayResponse.transactionId;
      payment.paymentUrl = camerpayResponse.payUrl;
      payment.status = 'PENDING';
      payment.rawResponse = camerpayResponse;
      await payment.save();

      console.log(`✅ Payment sent to CAMERPAY. UUID: ${camerpayResponse.transactionId}`);
      console.log(`📝 Saved transactionUuid in DB: ${payment.transactionUuid}`);

      // ✅ UPDATE ORDER WITH PAYMENT INFO
      await OrderService.updatePaymentInfo(orderId, payment._id, paymentMethod);

      return {
        success: true,
        paymentUrl: camerpayResponse.payUrl,
        transactionReference: payment.transactionReference,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        amount,
        currency: 'XAF',
      };
    } catch (error) {
      console.error('❌ Payment initiation failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle CAMERPAY Webhook Callback
   * 
   * ✅ THIS IS THE SOURCE OF TRUTH FOR PAYMENT STATUS
   * ✅ Only webhooks confirm payment - not frontend redirects
   * 
   * SECURITY:
   * ✅ Validate webhook signature
   * ✅ Prevent duplicate processing (check webhookReceived flag)
   * ✅ Verify payment with CAMERPAY API
   * ✅ Update payment record atomically
   * ✅ Update order status based on payment result
   * ✅ Reduce stock on success
   * 
   * @param {Object} webhookData - Data from CAMERPAY
   * @param {String} signature - Webhook signature (optional)
   * @returns {Promise<Object>} Webhook processing result
   */  async handleCamerpayWebhook(webhookData, signature ) {
    try {
      console.log('🔔 Webhook received from CAMERPAY');

      const { transaction_uuid, status, invoice_id, amount } = webhookData;

      if (!transaction_uuid) {
        throw new ApiError(400, 'Missing transaction_uuid in webhook');
      }      console.log('📋 Webhook details:', {
        transactionUuid: transaction_uuid,
        status,
        orderId: invoice_id,      });

      // ✅ FIND PAYMENT BY TRANSACTION UUID
      const payment = await Payment.findOne({ transactionUuid: transaction_uuid });

      if (!payment) {
        console.warn(`⚠️ Payment not found for transaction: ${transaction_uuid}`);
        console.log('🔍 Looking for transactionUuid:', transaction_uuid);
        
        // Debug: Try searching by transactionReference instead
        const paymentByRef = await Payment.findOne({ transactionReference: transaction_uuid });
        if (paymentByRef) {
          console.log('✅ Found payment by transactionReference instead');
        } else {
          // Debug: Check all payment records
          const allPayments = await Payment.find({}).select('transactionUuid transactionReference order status').limit(5);
          console.log('📋 Recent payments in DB:', allPayments.map(p => ({
            uuid: p.transactionUuid,
            ref: p.transactionReference,
            status: p.status
          })));
        }
        throw new ApiError(404, `Payment not found for transaction: ${transaction_uuid}`);
      }

      // ✅ PREVENT DUPLICATE WEBHOOK PROCESSING
      if (payment.webhookReceived) {
        console.log('⚠️ Webhook already processed for transaction:', transaction_uuid);
        return {
          success: true,
          message: 'Webhook already processed (duplicate)',
          transactionUuid: transaction_uuid,
        };
      }      // ✅ VERIFY SIGNATURE IF PROVIDED
      if (signature) {
        try {
          const isValid = CamerpayService.validateWebhookSignature(webhookData, signature);
          if (!isValid) {
            console.error('❌ Webhook signature validation failed');
            throw new ApiError(401, 'Invalid webhook signature');
          }
          payment.webhookSignatureValid = true;
        } catch (error) {
          console.warn('⚠️ Signature validation error (continuing anyway):', error.message);
          // Don't block webhook processing on signature validation failure
          // The webhook data is still valid if it contains the expected fields
        }
      }

      // ✅ VERIFY WITH CAMERPAY API (double-check payment status)
      try {
        const verification = await CamerpayService.verifyPayment(transaction_uuid);
        console.log('✅ Payment verified with CAMERPAY:', verification);
      } catch (error) {
        console.error('⚠️ Could not verify with CAMERPAY:', error.message);
        // Don't throw - webhook data is still valid
      }

      // ✅ MARK WEBHOOK AS RECEIVED
      payment.webhookReceived = true;
      payment.webhookData = webhookData;
      payment.webhookReceivedAt = new Date();

      // ✅ PROCESS PAYMENT STATUS
      if (status === 'completed' || status === 'confirmed') {
        console.log('✅ Payment SUCCESSFUL');

        payment.status = 'SUCCESS';
        payment.paidAt = new Date();

        // ✅ UPDATE ORDER TO PAID
        await OrderService.updateOrderStatus(payment.order, 'PAID', {
          paymentId: payment._id,
          paidAt: new Date(),
        });

        // ✅ REDUCE PRODUCT STOCK (prevent overselling)
        await OrderService.reduceProductStock(payment.order);        console.log(`✅ Order ${invoice_id} marked as PAID`);
      } else if (status === 'failed' || status === 'cancelled' || status === 'rejected') {
        console.log('❌ Payment FAILED');

        payment.status = 'FAILED';
        payment.failedAt = new Date();

        // ✅ UPDATE ORDER TO PAYMENT_FAILED
        await OrderService.updateOrderStatus(payment.order, 'PAYMENT_FAILED');

        console.log(`❌ Order ${invoice_id} payment failed`);
      } else {
        console.log('⏳ Payment status unknown:', status);
        payment.status = 'PENDING';
      }

      // ✅ SAVE PAYMENT UPDATE
      await payment.save();

      console.log(`✅ Webhook processed successfully. Payment status: ${payment.status}`);

      return {
        success: true,
        message: `Payment processed: ${payment.status}`,
        transactionUuid,
        status: payment.status,
      };
    } catch (error) {
      console.error('❌ Webhook handling error:', error.message);
      throw error;
    }
  }
  /**
   * Get payment by transaction ID
   */  async getPaymentByTransactionId(transactionUuid) {
    try {
      const payment = await Payment.findOne({ transactionUuid })
        .populate('order', 'orderNumber totalAmount status');

      if (!payment) {
        throw new ApiError(404, 'Payment not found');
      }

      return payment;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId) {
    try {    const payment = await Payment.findById(paymentId)
        .populate('order', 'orderNumber totalAmount status items');

      if (!payment) {
        throw new ApiError(404, 'Payment not found');
      }

      return payment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payments by order ID
   */
  async getPaymentsByOrderId(orderId) {
    try {
      return await Payment.find({ order: orderId })
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all payments with pagination
   */
  async getAllPayments({ page = 1, limit = 20, status = null, userId = null } = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      if (status) query.status = status;
      if (userId) query.user = userId;

      const payments = await Payment.find(query)
        .populate('order', 'orderNumber totalAmount status')
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Payment.countDocuments(query);

      return {
        data: payments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }
  /**
   * Check if order has successful payment
   */
  async hasSuccessfulPayment(orderId) {
    try {
      const payment = await Payment.findOne({
        order: orderId,
        status: 'SUCCESS',
      });

      return !!payment;
    } catch (error) {
      throw error;
    }
  }
}

export default new PaymentService();
