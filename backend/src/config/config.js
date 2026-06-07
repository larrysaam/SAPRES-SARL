
require("dotenv").config();

module.exports = {
  cinetpaySiteId: process.env.CINETPAY_SITE_ID,
  cinetpayApiKey: process.env.CINETPAY_API_KEY,
  cinetpayNotifyUrl: process.env.CINETPAY_NOTIFY_URL,
};
