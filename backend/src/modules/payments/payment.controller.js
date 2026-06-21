import httpStatus from 'http-status';
import { asyncHandler } from '../../utils/asyncHandler.js';
import PaymentService from './payment.service.js';
import CamerpayService from './camerpay.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import axios from 'axios';

const CINETPAY_BASE_URL = 'https://api-checkout.cinetpay.com/v2/payment';

const getAllPayments = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const payments = await PaymentService.getAll({ page, limit, status });
  return new ApiResponse(httpStatus.OK, payments, 'Payments fetched successfully').send(res);
});

const initiatePayment = asyncHandler(async (req, res) => {
  const { amount, currency, description, customer_id, transaction_id, return_url, cancel_url } = req.body;

  if (!amount || !currency || !description || !customer_id || !transaction_id) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Missing required payment details' });
  }

  const cinetpayPayload = {
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: transaction_id,
    amount: amount,
    currency: currency,
    description: description,
    return_url: return_url || 'http://localhost:3000/payment/success',
    cancel_url: cancel_url || 'http://localhost:3000/payment/cancel',
    notify_url: process.env.CINETPAY_NOTIFY_URL,
    customer_id: customer_id,
    channels: 'ALL',
  };

  try {
    const response = await axios.post(CINETPAY_BASE_URL, cinetpayPayload);
    if (response.data.code === '201') {
      res.status(httpStatus.OK).send({ message: 'Payment initiated successfully', payment_url: response.data.data.payment_url });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Failed to initiate payment with CinetPay', error: response.data.message });
    }
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Error initiating CinetPay payment' });
  }
});

const handleCinetpayCallback = asyncHandler(async (req, res) => {
  const { transaction_id, status, amount, currency } = req.body;
  if (!transaction_id || !status || !amount || !currency) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Missing required callback data' });
  }

  try {
    const verificationPayload = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transaction_id,
    };
    const verificationResponse = await axios.post(`${CINETPAY_BASE_URL}/check`, verificationPayload);

    if (verificationResponse.data.code === '200') {
      const transactionStatus = verificationResponse.data.data.status;
      const paymentStatus = transactionStatus === 'ACCEPTED' ? 'successful' : 'failed';
      await PaymentService.updatePaymentByTransactionId(transaction_id, { status: paymentStatus, amount, currency });
      res.status(httpStatus.OK).send({ message: 'CinetPay callback processed successfully', paymentStatus });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'CinetPay transaction verification failed' });
    }
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Error processing CinetPay callback' });
  }
});

/**
 * Initiate CAMERPAY payment (MTN Mobile Money or Orange Money)
 * POST /api/v1/payments/camerpay/initiate
 * 
 * Request body:
 * {
 *   "amount": 5000,
 *   "currency": "XAF",
 *   "phone": "699123456",
 *   "orderId": "ORDER-12345",
 *   "customerName": "Jean Dupont",
 *   "customerEmail": "jean@exemple.cm",
 *   "returnUrl": "https://yoursite.cm/payment/success",
 *   "callbackUrl": "https://yoursite.cm/callback"
 * }
 */
const initiateCamerpayPayment = asyncHandler(async (req, res) => {
  const {
    amount,
    currency = 'XAF',
    phone,
    orderId,
    customerName,
    customerEmail,
    returnUrl,
    callbackUrl,
  } = req.body;

  // Validate required fields
  if (!amount || !phone || !orderId || !customerName || !customerEmail) {
    throw new ApiError(
      'Missing required fields: amount, phone, orderId, customerName, customerEmail',
      httpStatus.BAD_REQUEST
    );
  }

  try {
    // Initiate payment with CAMERPAY service
    const paymentResult = await CamerpayService.initiatePayment({
      amount,
      currency,
      phone,
      orderId,
      customerName,
      customerEmail,
      returnUrl,
      callbackUrl,
    });

    // Save payment record to database
    const paymentRecord = await PaymentService.create({
      order: req.body.orderId, // Assuming orderId is the order document ID
      provider: 'camerpay',
      amount: paymentResult.amount,
      transactionReference: paymentResult.transactionId, // Store UUID
      status: 'pending',
      rawResponse: {
        provider: 'camerpay',
        transactionUuid: paymentResult.transactionId,
        initiatedAt: new Date().toISOString(),
      },
    });

    return new ApiResponse(
      httpStatus.OK,
      {
        success: true,
        transactionId: paymentResult.transactionId,
        payUrl: paymentResult.payUrl, // ✅ Redirect customer to this URL
        invoiceId: paymentResult.invoiceId,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        customerName: paymentResult.customerName,
        status: paymentResult.status,
        paymentRecordId: paymentRecord._id,
      },
      'CAMERPAY payment initiated successfully'
    ).send(res);
  } catch (error) {
    console.error('[CAMERPAY] Payment initiation error:', error.message);
    throw new ApiError(
      error.message || 'Failed to initiate CAMERPAY payment',
      httpStatus.BAD_REQUEST
    );
  }
});

/**
 * Verify CAMERPAY payment status
 * GET /api/v1/payments/camerpay/verify/:transactionId
 */
const verifyCamerpayPayment = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    throw new ApiError('Transaction ID (UUID) is required', httpStatus.BAD_REQUEST);
  }

  try {
    // Verify payment with CAMERPAY service
    const verificationResult = await CamerpayService.verifyPayment(transactionId);

    // Update payment record in database
    const newStatus = verificationResult.success ? 'successful' : 'failed';
    await PaymentService.updatePaymentByTransactionId(transactionId, {
      status: newStatus,
    });

    return new ApiResponse(
      httpStatus.OK,
      {
        success: verificationResult.success,
        status: verificationResult.status,
        transactionId: verificationResult.transactionUuid,
        amount: verificationResult.amount,
        currency: verificationResult.currency,
        invoiceId: verificationResult.invoiceId,
      },
      'Payment verification completed'
    ).send(res);
  } catch (error) {
    console.error('[CAMERPAY] Verification error:', error.message);
    throw error;
  }
});

/**
 * Handle CAMERPAY webhook callback
 * POST /api/v1/payments/camerpay/webhook
 * 
 * CAMERPAY sends webhook when payment status changes:
 * {
 *   "transaction_uuid": "uuid...",
 *   "merchant_invoice_id": "FACTURE-001",
 *   "amount": 5000,
 *   "currency": "XAF",
 *   "status": "confirmed|pending|failed",
 *   "customer_phone": "699123456",
 *   "created_at": "2024-01-01T12:00:00Z"
 * }
 */
const handleCamerpayWebhook = asyncHandler(async (req, res) => {
  const data = req.body;

  console.log('[CAMERPAY] Webhook received:', {
    transactionUuid: data.transaction_uuid,
    invoiceId: data.merchant_invoice_id,
    status: data.status,
  });

  // Validate webhook data
  if (!CamerpayService.validateWebhookCallback(data)) {
    console.warn('[CAMERPAY] Invalid webhook data');
    return new ApiResponse(
      httpStatus.BAD_REQUEST,
      null,
      'Invalid webhook data'
    ).send(res);
  }

  try {
    const {
      transaction_uuid,
      merchant_invoice_id,
      status,
      amount,
      currency,
      customer_phone,
    } = data;

    // Normalize status to our system's status
    const normalizedStatus = CamerpayService.normalizeStatus(status);

    // Update payment record
    const updatedPayment = await PaymentService.updatePaymentByTransactionId(transaction_uuid, {
      status: normalizedStatus,
      providerReference: transaction_uuid,
      rawResponse: {
        webhookData: data,
        receivedAt: new Date().toISOString(),
      },
    });

    console.log('[CAMERPAY] Webhook processed successfully:', {
      transactionUuid: transaction_uuid,
      newStatus: normalizedStatus,
    });

    // Return success response to CAMERPAY (200 OK)
    return new ApiResponse(
      httpStatus.OK,
      {
        transaction_uuid,
        status: normalizedStatus,
        received: true,
      },
      'Webhook processed successfully'
    ).send(res);
  } catch (error) {
    console.error('[CAMERPAY] Webhook processing error:', error.message);
    // Still return 200 to acknowledge receipt
    return new ApiResponse(
      httpStatus.OK,
      { error: error.message },
      'Webhook received but processing encountered an error'
    ).send(res);
  }
});

/**
 * Refund CAMERPAY payment
 * POST /api/v1/payments/camerpay/refund
 */
const refundCamerpayPayment = asyncHandler(async (req, res) => {
  const { transactionId, amount } = req.body;

  if (!transactionId) {
    throw new ApiError('Transaction ID (UUID) is required', httpStatus.BAD_REQUEST);
  }

  try {
    const refundResult = await CamerpayService.refundPayment(transactionId, amount);

    // Update payment record
    await PaymentService.updatePaymentByTransactionId(transactionId, {
      status: 'refunded',
      rawResponse: {
        refundId: refundResult.refundId,
        refundedAt: new Date().toISOString(),
      },
    });

    return new ApiResponse(
      httpStatus.OK,
      refundResult,
      'Payment refund processed successfully'
    ).send(res);
  } catch (error) {
    console.error('[CAMERPAY] Refund error:', error.message);
    throw error;
  }
});

export default {
  getAllPayments,
  initiatePayment,
  handleCinetpayCallback,
  initiateCamerpayPayment,
  verifyCamerpayPayment,
  handleCamerpayWebhook,
  refundCamerpayPayment,
};
