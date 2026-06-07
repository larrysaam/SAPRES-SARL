
const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { paymentService } = require('../../services');
const axios = require('axios');
const config = require('../../config/config'); // Assuming a config file exists to load env variables

const CINETPAY_BASE_URL = 'https://api-checkout.cinetpay.com/v2/payment';

const initiatePayment = catchAsync(async (req, res) => {
  const { amount, currency, description, customer_id, transaction_id, return_url, cancel_url } = req.body;

  if (!amount || !currency || !description || !customer_id || !transaction_id) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Missing required payment details' });
  }

  const cinetpayPayload = {
    apikey: config.cinetpayApiKey,
    site_id: config.cinetpaySiteId,
    transaction_id: transaction_id,
    amount: amount,
    currency: currency,
    description: description,
    return_url: return_url || 'http://localhost:3000/payment/success', // Default success URL
    cancel_url: cancel_url || 'http://localhost:3000/payment/cancel',   // Default cancel URL
    notify_url: config.cinetpayNotifyUrl,
    customer_id: customer_id,
    channels: 'ALL', // Allow all payment channels (MTN, Orange Money, etc.)
  };

  try {
    const response = await axios.post(CINETPAY_BASE_URL, cinetpayPayload);
    
    if (response.data.code === '201') { // CinetPay success code for redirection
      res.status(httpStatus.OK).send({ 
        message: 'Payment initiated successfully',
        payment_url: response.data.data.payment_url
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Failed to initiate payment with CinetPay',
        error: response.data.message
      });
    }
  } catch (error) {
    console.error('CinetPay initiation error:', error.response ? error.response.data : error.message);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Error initiating CinetPay payment' });
  }
});

const handleCinetpayCallback = catchAsync(async (req, res) => {
  const { transaction_id, status, amount, currency } = req.body;

  if (!transaction_id || !status || !amount || !currency) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Missing required callback data' });
  }

  try {
    // Verify the transaction with CinetPay to ensure authenticity
    const verificationPayload = {
      apikey: config.cinetpayApiKey,
      site_id: config.cinetpaySiteId,
      transaction_id: transaction_id,
    };

    const verificationResponse = await axios.post(`${CINETPAY_BASE_URL}/check`, verificationPayload);

    if (verificationResponse.data.code === '200') { // CinetPay success code for verification
      const transactionStatus = verificationResponse.data.data.status;
      const paymentStatus = transactionStatus === 'ACCEPTED' ? 'success' : 'failed';

      // Update payment status in your database using paymentService
      await paymentService.updatePaymentByTransactionId(transaction_id, { status: paymentStatus, amount, currency });

      res.status(httpStatus.OK).send({ message: 'CinetPay callback processed successfully', paymentStatus });
    } else {
      console.error('CinetPay verification failed:', verificationResponse.data.message);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'CinetPay transaction verification failed' });
    }

  } catch (error) {
    console.error('CinetPay callback error:', error.response ? error.response.data : error.message);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Error processing CinetPay callback' });
  }
});

module.exports = {
  initiatePayment,
  handleCinetpayCallback,
};
