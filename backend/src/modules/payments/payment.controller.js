import httpStatus from 'http-status';
import { asyncHandler } from '../../utils/asyncHandler.js';
import PaymentService from './payment.service.js';
import axios from 'axios';

const CINETPAY_BASE_URL = 'https://api-checkout.cinetpay.com/v2/payment';

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
      const paymentStatus = transactionStatus === 'ACCEPTED' ? 'success' : 'failed';
      await PaymentService.updatePaymentByTransactionId(transaction_id, { status: paymentStatus, amount, currency });
      res.status(httpStatus.OK).send({ message: 'CinetPay callback processed successfully', paymentStatus });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'CinetPay transaction verification failed' });
    }
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Error processing CinetPay callback' });
  }
});

export default { initiatePayment, handleCinetpayCallback };
