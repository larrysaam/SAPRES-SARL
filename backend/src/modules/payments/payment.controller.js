import httpStatus from 'http-status';
import { asyncHandler } from '../../utils/asyncHandler.js';
import PaymentService from './payment.service.js';
import CamerpayService from './camerpay.service.js';
import Payment from './payment.model.js';
import OrderService from '../orders/order.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Initiate CAMERPAY Payment
 * POST /api/v1/payments/camerpay/initiate
 * 
 * Supports both registered users and guest checkouts
 * 
 * Request Body:
 * {
 *   "orderId": "...",
 *   "paymentMethod": "mtn_money" | "orange_money"
 * }
 */
const initiateCamerpayPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod } = req.body;
  const userId = req.user?._id || null; // Optional for guests

  if (!orderId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'orderId is required');
  }

  if (!['mtn_money', 'orange_money'].includes(paymentMethod)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid paymentMethod');
  }

  const result = await PaymentService.initiateCamerpayPayment(
    orderId,
    userId,
    paymentMethod
  );

  console.log('Payment initiation result:', result);

  return new ApiResponse(
    httpStatus.OK,
    result,
    'Payment initiated successfully'
  ).send(res);
});

/**
 * Verify Payment Status
 * GET /api/v1/payments/camerpay/verify/:transactionReference
 */
const verifyPaymentStatus = asyncHandler(async (req, res) => {
  const { transactionReference } = req.params;

  if (!transactionReference) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'transactionReference is required');
  }

  const payment = await PaymentService.getPaymentByTransactionId(transactionReference);

  return new ApiResponse(
    httpStatus.OK,
    {
      success: payment.status === 'SUCCESS',
      status: payment.status,
      transactionReference: payment.transactionReference,
      amount: payment.amount,
      orderId: payment.order._id,
      paidAt: payment.paidAt,
    },
    'Payment status retrieved'
  ).send(res);
});

/**
 * Handle CAMERPAY Webhook Callback
 * POST /api/v1/payments/camerpay/webhook
 * NO AUTHENTICATION REQUIRED
 */
const handleCamerpayWebhook = asyncHandler(async (req, res) => {
  const webhookData = req.body;
  const signature = req.headers['x-camerpay-signature'];

  console.log('🔔 ========== WEBHOOK RECEIVED ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Webhook data:', JSON.stringify(webhookData, null, 2));
  console.log('Signature header:', signature || 'NOT PROVIDED');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('=======================================');

  if (!webhookData || typeof webhookData !== 'object') {
    console.error('❌ Invalid webhook data');
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid webhook data');
  }

  const result = await PaymentService.handleCamerpayWebhook(webhookData, signature);

  console.log('✅ Webhook processed result:', result);

  return new ApiResponse(
    httpStatus.OK,
    result,
    'Webhook processed successfully'
  ).send(res);
});

/**
 * Get Payment Details
 * GET /api/v1/payments/:paymentId
 */
const getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'paymentId is required');
  }

  const payment = await PaymentService.getPaymentById(paymentId);

  return new ApiResponse(
    httpStatus.OK,
    payment,
    'Payment details retrieved'
  ).send(res);
});

/**
 * Get Order Payments
 * GET /api/v1/payments/order/:orderId
 */
const getOrderPayments = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'orderId is required');
  }

  const payments = await PaymentService.getPaymentsByOrderId(orderId);

  return new ApiResponse(
    httpStatus.OK,
    payments,
    'Order payments retrieved'
  ).send(res);
});

/**
 * Get All Payments (Admin)
 * GET /api/v1/payments
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = null, userId = null } = req.query;

  const payments = await PaymentService.getAllPayments({
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    userId,
  });

  return new ApiResponse(
    httpStatus.OK,
    payments,
    'Payments retrieved'
  ).send(res);
});

/**
 * Check Payment Status and Update if Needed (for testing/manual trigger)
 * POST /api/v1/payments/camerpay/check-status/:transactionUuid
 * 
 * This endpoint manually checks payment status with CAMERPAY
 * and updates order/payment if status changed
 */
const checkAndUpdatePaymentStatus = asyncHandler(async (req, res) => {
  const { transactionUuid } = req.params;

  if (!transactionUuid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'transactionUuid is required');
  }

  console.log(`🔍 Checking payment status for transaction: ${transactionUuid}`);

  // Find payment by transaction UUID
  const payment = await Payment.findOne({ transactionUuid });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  // If already processed, return current status
  if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
    console.log('✅ Payment already processed:', payment.status);
    return new ApiResponse(
      httpStatus.OK,
      {
        transactionUuid,
        status: payment.status,
        message: 'Payment already processed',
      },
      'Payment status retrieved'
    ).send(res);
  }

  // Verify payment status with CAMERPAY
  try {
    const verification = await CamerpayService.verifyPayment(transactionUuid);
    console.log('✅ Payment verified with CAMERPAY:', verification);

    // If payment is now confirmed, update status
    if (verification.status === 'confirmed' || verification.status === 'success') {
      console.log('✅ Payment is confirmed! Updating order...');

      payment.status = 'SUCCESS';
      payment.paidAt = new Date();
      payment.webhookData = verification;
      await payment.save();

      // Update order status
      await OrderService.updateOrderStatus(payment.order, 'PAID');
      await OrderService.reduceProductStock(payment.order);

      console.log('✅ Order and payment updated to PAID');

      return new ApiResponse(
        httpStatus.OK,
        {
          transactionUuid,
          status: 'SUCCESS',
          message: 'Payment confirmed and order updated',
        },
        'Payment status updated successfully'
      ).send(res);
    }

    // Payment still pending
    return new ApiResponse(
      httpStatus.OK,
      {
        transactionUuid,
        status: verification.status,
        message: `Payment status: ${verification.status}`,
      },
      'Payment status retrieved'
    ).send(res);
  } catch (error) {
    console.error('⚠️ Could not verify with CAMERPAY:', error.message);
    
    return new ApiResponse(
      httpStatus.OK,
      {
        transactionUuid,
        status: payment.status,
        message: 'Could not verify with CAMERPAY - payment still pending',
      },
      'Payment status'
    ).send(res);
  }
});

// Legacy endpoints - deprecated
const initiatePayment = asyncHandler(async (req, res) => {
  throw new ApiError(httpStatus.GONE, 'CinetPay is deprecated');
});

const handleCinetpayCallback = asyncHandler(async (req, res) => {
  throw new ApiError(httpStatus.GONE, 'CinetPay is deprecated');
});

export default {
  initiateCamerpayPayment,
  verifyPaymentStatus,
  handleCamerpayWebhook,
  checkAndUpdatePaymentStatus,
  getPaymentDetails,
  getOrderPayments,
  getAllPayments,
  initiatePayment,
  handleCinetpayCallback,
};
