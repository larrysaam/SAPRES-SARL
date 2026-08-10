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
      } = paymentData;      // Validate required fields
      if (!amount || !phone || !orderId || !customerName || !customerEmail) {
        throw new ApiError(400, 'Missing required fields: amount, phone, orderId, customerName, customerEmail');
      }

      // Normalize phone number (remove non-digits)
      const normalizedPhone = phone.replace(/\D/g, '');
      if (!normalizedPhone || normalizedPhone.length < 9) {
        throw new ApiError(400, 'Invalid phone number format');
      }

      // CAMERPAY payload structure (v2.0)
      const payload = {
        amount: Math.round(amount),
        currency: currency.toUpperCase(),
        merchant_invoice_id: orderId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: normalizedPhone,
        // merchant_callback_url: 'https://ceramics-storage-canopener.ngrok-free.dev/api/v1/payments/camerpay/webhook',
        merchant_callback_url: `${BACKEND_URL}/api/v1/payments/camerpay/webhook`,
        merchant_return_url: 'https://www.sapressarl.com',
        source: 'api',
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
      );      // CAMERPAY returns: { success, transaction_uuid, pay_url, status }

      if (!response.data.success || !response.data.transaction_uuid) {
        console.error('[CAMERPAY] Invalid response:', response.data);
        throw new ApiError(500, 'Invalid CAMERPAY response - missing transaction_uuid');
      }

      console.log(`[CAMERPAY] Payment initiated - Transaction UUID: ${response.data.transaction_uuid}`);

      return {
        success: true,
        provider: 'camerpay',
        transactionId: response.data.transaction_uuid,
        payUrl: response.data.pay_url,
        invoiceId: orderId,
        amount,
        currency,
        customerName,
        customerPhone: `****${normalizedPhone.slice(-4)}`,
        status: response.data.status,
      };    } catch (error) {
      console.error('[CAMERPAY] Payment initiation error:', error.message);
      
      // Handle axios errors properly
      if (error.response?.data) {
        console.error('[CAMERPAY] Response error:', error.response.data);
        // Make sure statusCode is a number
        const statusCode = error.response.status || 500;
        throw new ApiError(statusCode, `CAMERPAY Error: ${error.response.data.message || error.message}`);
      }
      
      // If it's already an ApiError, re-throw it
      if (error instanceof ApiError) {
        throw error;
      }
      
      // For other errors, ensure proper status code (must be a number)
      throw new ApiError(500, `Payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment status with CAMERPAY
   * GET /api/payment/{transaction_uuid}
   * @param {String} transactionUuid - Transaction UUID from CAMERPAY
   * @returns {Promise} Payment status
   */  async verifyPayment(transactionUuid) {
    try {
      if (!transactionUuid) {
        throw new ApiError(400, 'Transaction UUID is required');
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
        throw new ApiError(404, 'Transaction not found');
      }
      throw new ApiError(500, `Payment verification failed: ${error.message}`);
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

  /**
   * Validate webhook signature from CAMERPAY
   * CAMERPAY signs webhooks for security verification
   * @param {Object} webhookData - Webhook payload
   * @param {String} signature - Signature from webhook header
   * @returns {Boolean} Is valid signature
   */
  validateWebhookSignature(webhookData, signature) {
    try {
      if (!signature || !this.apiToken) {
        console.warn('[CAMERPAY] Missing signature or API token for validation');
        return false;
      }

      // CamerPay uses HMAC-SHA256 with API token as secret
      // We create a hash of the webhook data and compare with the provided signature
      const webhookString = JSON.stringify(webhookData);
      const expectedSignature = crypto
        .createHmac('sha256', this.apiToken)
        .update(webhookString)
        .digest('hex');

      const isValid = expectedSignature === signature;
      
      if (isValid) {
        console.log('[CAMERPAY] ✅ Webhook signature valid');
      } else {
        console.warn('[CAMERPAY] ❌ Webhook signature invalid');
      }

      return isValid;
    } catch (error) {
      console.error('[CAMERPAY] Webhook signature validation error:', error.message);
      return false;
    }
  }
}

export default new CamerpayService();
