import express from 'express';
import paymentController from './payment.controller.js';

const router = express.Router();

router.post('/initiate', paymentController.initiatePayment);
router.post('/cinetpay-callback', paymentController.handleCinetpayCallback);

export default router;
