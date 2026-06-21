import axios from 'axios';
import crypto from 'crypto';
import { ApiError } from '../../utils/ApiError.js';

// CAMERPAY uses https://camerpay.biz/api as base URL
const CAMERPAY_BASE_URL = 'https://camerpay.biz/api';

class CamerpayService {
  constructor() {
    this.apiToken = process.env.CAMERPAY_API_TOKEN; // Bearer token from CAMERPAY
    this.baseUrl = CAMERPAY_BASE_URL;

    if (!this.apiToken) {
      console.warn('[CAMERPAY] API token not configured. CAMERPAY payments will not work.');
    }
  }

  /**
   * Initiate payment with CAMERPAY
   * POST /api/payment/initiate
   * @param {Object} paymentData - Payment details
   * @returns {Promise} Payment initiation response with pay_url
   */
  async initiatePayment(paymentData) {
    try {
      const {
        amount,
        currency = 'XAF',
        phone,
        orderId,
        description,
        customerEmail,
        customerName,
        returnUrl,
        callbackUrl,
      } = paymentData;

      // Validate required fields
      if (!amount || !phone || !orderId || !customerName || !customerEmail) {
        throw new ApiError('Missing required fields: amount, phone, orderId, customerName, customerEmail', 400);
      }

      // Normalize phone number (remove non-digits)
      const normalizedPhone = phone.replace(/\D/g, '');
      if (!normalizedPhone || normalizedPhone.length < 9) {
        throw new ApiError('Invalid phone number format', 400);
      }

      // CAMERPAY payload structure (v2.0)
      const payload = {
        amount: Math.round(amount), // Amount in XAF (or specified currency)
        currency: currency.toUpperCase(),
        merchant_invoice_id: orderId, // Unique invoice/order ID
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: normalizedPhone,
        merchant_callback_url: callbackUrl || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/camerpay/webhook`,
        merchant_return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
        source: 'api', // Required by CAMERPAY
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
      };

      console.log(`[CAMERPAY] Initiating payment for invoice: ${orderId}, Amount: ${amount} ${currency}`);

      const response = await axios.post(
        `${this.baseUrl}/payment/initiate`,
        payload,
        { headers, timeout: 10000 }
      );

      // CAMERPAY returns: { success, transaction_uuid, pay_url, status }
      if (!response.data.success || !response.data.transaction_uuid) {
        throw new ApiError('Invalid CAMERPAY response - missing transaction_uuid', 500);
      }

      console.log(`[CAMERPAY] Payment initiated - Transaction UUID: ${response.data.transaction_uuid}`);

      return {
        success: true,
        provider: 'camerpay',
        transactionId: response.data.transaction_uuid, // Use transaction_uuid as ID
        payUrl: response.data.pay_url, // Redirect customer to this URL
        invoiceId: orderId,
        amount,
        currency,
        customerName,
        customerPhone: `****${normalizedPhone.slice(-4)}`,
        status: response.data.status, // 'pending'
      };
    } catch (error) {
      console.error('[CAMERPAY] Payment initiation error:', error.message);
      if (error.response?.data?.message) {
        throw new ApiError(`CAMERPAY Error: ${error.response.data.message}`, error.response.status || 500);
      }
      throw new ApiError(`Payment initiation failed: ${error.message}`, 500);
    }
  }

  /**
   * Verify payment status with CAMERPAY
   * GET /api/payment/{transaction_uuid}
   * @param {String} transactionUuid - Transaction UUID from CAMERPAY
   * @returns {Promise} Payment status
   */
  async verifyPayment(transactionUuid) {
    try {
      if (!transactionUuid) {
        throw new ApiError('Transaction UUID is required', 400);
      }

      const headers = {
        'Authorization': `Bearer ${this.apiToken}`,
      };

      console.log(`[CAMERPAY] Verifying transaction: ${transactionUuid}`);

      const response = await axios.get(
        `${this.baseUrl}/payment/${transactionUuid}`,
        { headers, timeout: 10000 }
      );

      const paymentData = response.data;
      // CAMERPAY status: 'pending', 'confirmed', 'failed', 'refunded'
      const isSuccess = paymentData.status === 'confirmed' || paymentData.status === 'success';

      console.log(`[CAMERPAY] Payment status: ${paymentData.status}`);

      return {
        success: isSuccess,
        status: paymentData.status,
        transactionUuid,
        invoiceId: paymentData.merchant_invoice_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        customerPhone: paymentData.customer_phone,
        timestamp: paymentData.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('[CAMERPAY] Payment verification error:', error.message);
      if (error.response?.status === 404) {
        throw new ApiError('Transaction not found', 404);
      }
      throw new ApiError(`Payment verification failed: ${error.message}`, 500);
    }
  }

  /**
   * Validate CAMERPAY webhook callback
   * CAMERPAY sends webhook with transaction data when payment status changes
   * @param {Object} data - Webhook payload
   * @returns {Boolean} Is valid webhook from CAMERPAY
   */
  validateWebhookCallback(data) {
    try {
      // CAMERPAY sends basic webhook with transaction data
      // Validate that required fields are present
      if (!data.transaction_uuid || !data.merchant_invoice_id || !data.amount) {
        console.warn('[CAMERPAY] Invalid webhook data - missing required fields');
        return false;
      }

      console.log(`[CAMERPAY] Webhook validated for transaction: ${data.transaction_uuid}`);
      return true;
    } catch (error) {
      console.error('[CAMERPAY] Webhook validation error:', error.message);
      return false;
    }
  }

  /**
   * Normalize payment status
   * @param {String} status - Status from CAMERPAY
   * @returns {String} Normalized status for our system
   */
  normalizeStatus(status) {
    const statusMap = {
      'confirmed': 'successful',
      'success': 'successful',
      'pending': 'pending',
      'failed': 'failed',
      'refunded': 'refunded',
    };
    return statusMap[status?.toLowerCase()] || status;
  }
}

export default new CamerpayService();
