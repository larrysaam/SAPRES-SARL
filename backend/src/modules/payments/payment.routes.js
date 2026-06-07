
const express = require("express");
const paymentController = require("./payment.controller");

const router = express.Router();

router.post("/initiate", paymentController.initiatePayment);
router.post("/cinetpay-callback", paymentController.handleCinetpayCallback);

module.exports = router;
