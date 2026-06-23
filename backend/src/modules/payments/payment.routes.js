import express from 'express';
import paymentController from './payment.controller.js';
import authenticate from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * ✅ SECURE PAYMENT ROUTES FOLLOWING BEST PRACTICES
 * 
 * FLOW:
 * 1. POST /camerpay/initiate - Start payment process (guests + users)
 * 2. GET /camerpay/verify/:ref - Check payment status (guests + users)
 * 3. POST /camerpay/webhook - Webhook endpoint (NO auth - CAMERPAY calls directly)
 */

// Get all payments (admin only)
router.get('/', paymentController.getAllPayments);

// Get payment details (admin only)
router.get('/:paymentId', authenticate, paymentController.getPaymentDetails);

// Get all payments for an order (admin only)
router.get('/order/:orderId', authenticate, paymentController.getOrderPayments);

// CAMERPAY Endpoints
// 1. Initiate payment (NO auth required - supports guest checkout)
router.post('/camerpay/initiate', paymentController.initiateCamerpayPayment);

// 2. Verify payment status (NO auth required - supports guest checkout)
router.get('/camerpay/verify/:transactionReference', paymentController.verifyPaymentStatus);

// 3. Check and update payment status (manual verification for testing)
router.post('/camerpay/check-status/:transactionUuid', paymentController.checkAndUpdatePaymentStatus);

// 4. Webhook callback (NO authentication - CAMERPAY calls directly)
router.post('/camerpay/webhook', paymentController.handleCamerpayWebhook);

export default router;

