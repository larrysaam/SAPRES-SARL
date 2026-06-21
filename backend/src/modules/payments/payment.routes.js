import express from 'express';
import paymentController from './payment.controller.js';
import  authenticate  from '../../middlewares/auth.middleware.js';

const router = express.Router();

// General payment endpoints
router.get('/', paymentController.getAllPayments);

// CinetPay endpoints (legacy)
router.post('/initiate', paymentController.initiatePayment);
router.post('/cinetpay-callback', paymentController.handleCinetpayCallback);

// CAMERPAY endpoints (MTN Mobile Money & Orange Money)
router.post('/camerpay/initiate', paymentController.initiateCamerpayPayment);
router.post('/camerpay/webhook', paymentController.handleCamerpayWebhook);
router.get('/camerpay/verify/:transactionId', paymentController.verifyCamerpayPayment);
router.post('/camerpay/refund', paymentController.refundCamerpayPayment);

export default router;
