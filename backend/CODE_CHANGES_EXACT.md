# Code Changes - Exact Modifications

## File: `payment.service.js`

### Change 1: Lines 37-53 - ApiError Parameter Corrections
```javascript
// BEFORE (lines 37-53)
if (!order) {
  throw new ApiError('Order not found', 404);
}
if (order.status !== 'PENDING_PAYMENT') {
  throw new ApiError(
    `Cannot pay for order with status: ${order.status}. Order must be in PENDING_PAYMENT status.`,
    400
  );
}
if (!order.items || order.items.length === 0) {
  throw new ApiError('Order has no items', 400);
}
const amount = order.totalAmount;
if (!amount || amount <= 0) {
  throw new ApiError('Invalid order amount', 400);
}

// AFTER (lines 37-53)
if (!order) {
  throw new ApiError(404, 'Order not found');
}
if (order.status !== 'PENDING_PAYMENT') {
  throw new ApiError(
    400,
    `Cannot pay for order with status: ${order.status}. Order must be in PENDING_PAYMENT status.`
  );
}
if (!order.items || order.items.length === 0) {
  throw new ApiError(400, 'Order has no items');
}
const amount = order.totalAmount;
if (!amount || amount <= 0) {
  throw new ApiError(400, 'Invalid order amount');
}
```

---

### Change 2: Lines 135-143 - Webhook Field Name & Error Handling
```javascript
// BEFORE (lines 135-143)
async handleCamerpayWebhook(webhookData, signature ) {
  try {
    console.log('🔔 Webhook received from CAMERPAY');

    const { transaction_uuid, status, merchant_invoice_id, amount } = webhookData;

    if (!transaction_uuid) {
      throw new ApiError('Missing transaction_uuid in webhook', 400);
    }

    console.log('📋 Webhook details:', {
      transactionUuid: transaction_uuid,
      status,
      orderId: merchant_invoice_id,
    });

// AFTER (lines 135-143)
async handleCamerpayWebhook(webhookData, signature ) {
  try {
    console.log('🔔 Webhook received from CAMERPAY');

    const { transaction_uuid, status, invoice_id, amount } = webhookData;

    if (!transaction_uuid) {
      throw new ApiError(400, 'Missing transaction_uuid in webhook');
    }

    console.log('📋 Webhook details:', {
      transactionUuid: transaction_uuid,
      status,
      orderId: invoice_id,
    });
```

---

### Change 3: Lines 150-167 - Payment Lookup & Signature Error
```javascript
// BEFORE (lines 150-167)
const payment = await Payment.findOne({ transactionUuid: transaction_uuid });

if (!payment) {
  console.warn(`⚠️ Payment not found for transaction: ${transaction_uuid}`);
  throw new ApiError(`Payment not found for transaction: ${transaction_uuid}`, 404);
}

// ... webhook processing code ...

if (!isValid) {
  console.error('❌ Webhook signature validation failed');
  throw new ApiError('Invalid webhook signature', 401);
}

// AFTER (lines 150-167)
const payment = await Payment.findOne({ transactionUuid: transaction_uuid });

if (!payment) {
  console.warn(`⚠️ Payment not found for transaction: ${transaction_uuid}`);
  throw new ApiError(404, `Payment not found for transaction: ${transaction_uuid}`);
}

// ... webhook processing code ...

if (!isValid) {
  console.error('❌ Webhook signature validation failed');
  throw new ApiError(401, 'Invalid webhook signature');
}
```

---

### Change 4: Lines 200-210 - Log Updates with Correct Field Name
```javascript
// BEFORE (lines 200-210)
console.log(`✅ Order ${merchant_invoice_id} marked as PAID`);
} else if (status === 'failed' || status === 'cancelled' || status === 'rejected') {
  console.log('❌ Payment FAILED');

  payment.status = 'FAILED';
  payment.failedAt = new Date();

  await OrderService.updateOrderStatus(payment.order, 'PAYMENT_FAILED');

  console.log(`❌ Order ${merchant_invoice_id} payment failed`);

// AFTER (lines 200-210)
console.log(`✅ Order ${invoice_id} marked as PAID`);
} else if (status === 'failed' || status === 'cancelled' || status === 'rejected') {
  console.log('❌ Payment FAILED');

  payment.status = 'FAILED';
  payment.failedAt = new Date();

  await OrderService.updateOrderStatus(payment.order, 'PAYMENT_FAILED');

  console.log(`❌ Order ${invoice_id} payment failed`);
```

---

### Change 5: Lines 240-257 - Remaining ApiError Corrections
```javascript
// BEFORE (line 240)
async getPaymentByTransactionId(transactionUuid) {
  try {
    const payment = await Payment.findOne({ transactionUuid })
      .populate('order', 'orderNumber totalAmount status');

    if (!payment) {
      throw new ApiError('Payment not found', 404);
    }

// AFTER (line 240)
async getPaymentByTransactionId(transactionUuid) {
  try {
    const payment = await Payment.findOne({ transactionUuid })
      .populate('order', 'orderNumber totalAmount status');

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }
```

```javascript
// BEFORE (line 257)
async getPaymentById(paymentId) {
  try {
    const payment = await Payment.findById(paymentId)
      .populate('order', 'orderNumber totalAmount status items');

    if (!payment) {
      throw new ApiError('Payment not found', 404);
    }

// AFTER (line 257)
async getPaymentById(paymentId) {
  try {
    const payment = await Payment.findById(paymentId)
      .populate('order', 'orderNumber totalAmount status items');

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }
```

---

## Summary of Changes

| # | Type | Location | Change |
|---|------|----------|--------|
| 1 | ApiError | Line 37 | `('Order not found', 404)` → `(404, 'Order not found')` |
| 2 | ApiError | Line 42 | Message moved, statusCode first |
| 3 | ApiError | Line 47 | `('Order has no items', 400)` → `(400, 'Order has no items')` |
| 4 | ApiError | Line 53 | `('Invalid order amount', 400)` → `(400, 'Invalid order amount')` |
| 5 | Field | Line 135 | `merchant_invoice_id` → `invoice_id` |
| 6 | ApiError | Line 137 | `('Missing...', 400)` → `(400, 'Missing...')` |
| 7 | Log | Line 143 | `merchant_invoice_id` → `invoice_id` |
| 8 | ApiError | Line 150 | Message moved, statusCode first |
| 9 | ApiError | Line 167 | `('Invalid signature', 401)` → `(401, 'Invalid signature')` |
| 10 | Log | Line 200 | `merchant_invoice_id` → `invoice_id` |
| 11 | Log | Line 210 | `merchant_invoice_id` → `invoice_id` |
| 12 | ApiError | Line 240 | `('Payment not found', 404)` → `(404, 'Payment not found')` |
| 13 | ApiError | Line 257 | `('Payment not found', 404)` → `(404, 'Payment not found')` |

---

## Verification

All changes have been applied and verified:
- ✅ No syntax errors
- ✅ All ApiError parameters in correct order
- ✅ All webhook field names use `invoice_id`
- ✅ All logs reference correct field names

---

## Result

**Before**: Webhook processing broken, HTTP 500 errors, order not updated
**After**: Webhook processing working, correct HTTP status codes, order updates to PAID

Status: ✅ **READY FOR PRODUCTION**
