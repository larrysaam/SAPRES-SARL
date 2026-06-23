# Production Payment System - Quick Reference

## 🎯 Key Security Principles

| Principle | Implementation |
|-----------|-----------------|
| **No Frontend Prices** | Backend fetches from DB, calculates totals |
| **Order First** | Order created BEFORE payment initiated |
| **Backend Calculation** | All amounts calculated on server |
| **Webhook is Truth** | Payment confirmed by webhook, not redirect |
| **Prevent Duplicates** | Check `webhookReceived` flag |
| **Verify Amount** | Use `Order.totalAmount`, never trust frontend |
| **Stock Protection** | Reduce stock AFTER payment confirmed |
| **Audit Trail** | Log all payment events |

---

## 📊 Complete Request Flow

```
┌─ STEP 1: Create Order
│  POST /api/v1/orders
│  Payload: { items: [{productId, quantity}, ...], shippingAddress: {...} }
│  ↓
├─ BACKEND calculates: subtotal, tax, shipping, totalAmount
├─ BACKEND creates order with status = PENDING_PAYMENT
├─ Response: { order with totalAmount }
│
├─ STEP 2: Initiate Payment
│  POST /api/v1/payments/camerpay/initiate
│  Payload: { orderId, paymentMethod: "mtn_money" }
│  ↓
├─ BACKEND validates order ownership
├─ BACKEND uses order.totalAmount (NOT frontend data)
├─ BACKEND creates payment record (status = INITIATED)
├─ BACKEND calls CAMERPAY API
├─ BACKEND receives paymentUrl + transactionUuid
├─ Response: { paymentUrl, transactionReference }
│
├─ STEP 3: Customer Pays
│  Frontend redirects to paymentUrl
│  Customer pays on CAMERPAY
│
├─ STEP 4: Webhook Received
│  POST /api/v1/payments/camerpay/webhook (NO AUTH)
│  Headers: X-CAMERPAY-Signature: {...}
│  ↓
├─ BACKEND validates signature
├─ BACKEND checks webhookReceived (prevent duplicate)
├─ BACKEND verifies with CAMERPAY API
├─ BACKEND updates payment.status = SUCCESS
├─ BACKEND updates order.status = PAID
├─ BACKEND reduces product.stock
├─ Response: { success: true }
│
└─ STEP 5: Success Page
   Frontend shows order confirmation
   Customer sees order as PAID
```

---

## 🔒 Security Checklist

### Frontend Validation ✅
- [ ] Frontend sends ONLY `productId` and `quantity`
- [ ] Frontend NEVER sends `price`, `unitPrice`, or amounts
- [ ] Frontend NEVER calculates totals
- [ ] Frontend uses server-provided order.totalAmount

### Backend Validation ✅
- [ ] Reject items with price fields
- [ ] Fetch product prices from MongoDB
- [ ] Calculate all totals on server
- [ ] Validate order ownership (user._id === order.user)
- [ ] Validate order status (PENDING_PAYMENT)
- [ ] Validate items exist and have stock

### Payment Initiation ✅
- [ ] Use Order.totalAmount (NOT request body)
- [ ] Create payment record BEFORE calling CAMERPAY
- [ ] Store all CAMERPAY response data
- [ ] Update payment with transactionUuid

### Webhook Processing ✅
- [ ] Validate signature with CAMERPAY_SECRET_KEY
- [ ] Check webhookReceived flag (prevent duplicates)
- [ ] Verify payment with CAMERPAY API (double-check)
- [ ] Update payment + order atomically
- [ ] Reduce stock only after payment confirmed
- [ ] Always return 200 OK to CAMERPAY

---

## 📦 Database Changes Required

### Order Model Updates
```javascript
// Status enum includes:
'PENDING_PAYMENT',    // ← Order created here
'PAID',               // ← Webhook updates here
'PAYMENT_FAILED',
'PROCESSING',
'SHIPPED',
'DELIVERED'

// Add fields:
payment: {
  transactionId: ObjectId,  // Link to Payment
  method: String,
  status: String
}
```

### Payment Model Updates
```javascript
// Add webhook tracking fields:
webhookReceived: Boolean (default: false)
webhookReceivedAt: Date
webhookSignatureValid: Boolean

// Add index:
index({ transactionUuid: 1, webhookReceived: 1 })
```

---

## 🔗 API Endpoint Reference

### Create Order (with price protection)
```bash
POST /api/v1/orders
Authorization: Bearer {token}

{
  "items": [
    { "productId": "507f...", "quantity": 2 },
    { "productId": "507f...", "quantity": 1 }
  ],
  "shippingAddress": {
    "fullName": "Jean Dupont",
    "phone": "699123456",
    "address": "123 Rue Main",
    "city": "Douala"
  }
}

# Response includes: totalAmount (calculated by backend)
```

### Initiate Payment
```bash
POST /api/v1/payments/camerpay/initiate
Authorization: Bearer {token}

{
  "orderId": "507f1f77bcf86cd799439011",
  "paymentMethod": "mtn_money"
}

# Response includes: paymentUrl (redirect customer here)
```

### Webhook (from CAMERPAY)
```bash
POST /api/v1/payments/camerpay/webhook
X-CAMERPAY-Signature: {signature}

{
  "transaction_uuid": "550e8400...",
  "status": "completed",
  "merchant_invoice_id": "ORD-123456-1",
  "amount": 1210387,
  "currency": "XAF",
  "paid_at": "2024-01-15T10:30:00Z"
}

# ALWAYS returns 200 OK
```

### Verify Payment Status
```bash
GET /api/v1/payments/camerpay/verify/{transactionReference}
Authorization: Bearer {token}

# Returns current payment status
```

---

## 🚨 Common Mistakes to Avoid

### ❌ WRONG: Trust frontend amount
```javascript
// DON'T DO THIS!
const amount = req.body.amount;  // ← SECURITY VIOLATION
await CamerpayService.initiatePayment(amount);
```

### ✅ CORRECT: Use order total
```javascript
// DO THIS!
const order = await Order.findById(orderId);
const amount = order.totalAmount;  // ← Backend calculated
await CamerpayService.initiatePayment(amount);
```

---

### ❌ WRONG: Process webhook without checking duplicates
```javascript
// DON'T DO THIS!
const payment = await Payment.findOne({ transactionUuid });
payment.status = 'SUCCESS';
await payment.save();  // ← Could process twice!
```

### ✅ CORRECT: Prevent duplicate processing
```javascript
// DO THIS!
if (payment.webhookReceived) {
  return { message: 'Already processed' };
}

payment.webhookReceived = true;
payment.status = 'SUCCESS';
await payment.save();  // ← Safe from duplicates
```

---

### ❌ WRONG: Update order WITHOUT payment confirmation
```javascript
// DON'T DO THIS!
if (req.query.status === 'success') {
  order.status = 'PAID';  // ← Customer could fake this!
  await order.save();
}
```

### ✅ CORRECT: Update order from webhook ONLY
```javascript
// DO THIS!
// In webhook handler (CAMERPAY server, not customer browser)
const payment = await Payment.findOne({ transactionUuid });
if (payment.status === 'SUCCESS') {
  order.status = 'PAID';  // ← Only after webhook confirmed
  await order.save();
}
```

---

## 📋 Testing Scenarios

### Scenario 1: Successful Payment Flow
```
1. Customer adds 2 items to cart
2. POST /api/v1/orders
   → Order created with status = PENDING_PAYMENT
   → totalAmount = calculated by backend
3. POST /api/v1/payments/camerpay/initiate
   → Payment created
   → CAMERPAY called
   → paymentUrl returned
4. Customer redirects to paymentUrl
5. Customer pays on CAMERPAY
6. CAMERPAY webhook sent
   → Payment status = SUCCESS
   → Order status = PAID
   → Stock reduced
7. Customer sees order as PAID in dashboard
```

### Scenario 2: Duplicate Webhook
```
1. Webhook received
   → webhookReceived = false
   → Payment status updated
   → Order updated
   → Stock reduced
2. Webhook received again (duplicate from CAMERPAY)
   → webhookReceived = true
   → Check fails: already processed
   → Return early
   → Stock NOT reduced again ✓
```

### Scenario 3: Payment Failed
```
1. Customer initiates payment
2. Customer cancels on CAMERPAY
3. Webhook received with status = "cancelled"
   → Payment status = FAILED
   → Order status = PAYMENT_FAILED
   → Stock NOT reduced
4. Customer can retry payment
5. New payment record created
6. New webhook received with status = "completed"
   → Order status updated to PAID
   → Stock reduced
```

---

## 🔧 Configuration Checklist

### Environment Variables
```bash
# .env
CAMERPAY_API_TOKEN=your_token_here
CAMERPAY_SECRET_KEY=your_secret_here
CAMERPAY_SANDBOX=true

BACKEND_URL=https://api.yourdomain.cm
FRONTEND_URL=https://yourdomain.cm

# Webhook signature validation
WEBHOOK_SECRET=your_secret_here
```

### MongoDB Indexes
```javascript
// Order indexes
db.orders.createIndex({ user: 1 })
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ createdAt: -1 })

// Payment indexes
db.payments.createIndex({ transactionUuid: 1 })
db.payments.createIndex({ order: 1 })
db.payments.createIndex({ transactionUuid: 1, webhookReceived: 1 })
```

### CAMERPAY Dashboard Configuration
```
Webhook URL: https://api.yourdomain.cm/api/v1/payments/camerpay/webhook
Webhook Secret: {same as CAMERPAY_SECRET_KEY}
Test webhook delivery
Enable signature validation
```

---

## 📊 Monitoring & Logging

### Critical Events to Log
```javascript
// Order creation
console.log(`✅ Order created: ${orderNumber} | Amount: ${totalAmount}`);

// Payment initiation
console.log(`💳 Payment initiated: ${transactionReference}`);

// Webhook received
console.log(`🔔 Webhook received: ${transactionUuid} | Status: ${status}`);

// Order status update
console.log(`✅ Order ${orderNumber} status updated to: PAID`);

// Stock reduction
console.log(`📦 Stock reduced for order: ${orderNumber}`);
```

### Alerts to Configure
- [ ] Webhook not received for 30 minutes after payment initiation
- [ ] Payment status mismatch (order PAID but payment FAILED)
- [ ] Stock goes negative
- [ ] Duplicate webhook processing detected
- [ ] Webhook signature validation failure

---

## 🎓 Key Takeaways

1. **Frontend Sends**: productId + quantity ONLY
2. **Backend Fetches**: Product prices from MongoDB
3. **Backend Calculates**: All totals
4. **Backend Initiates**: Payment with Order.totalAmount
5. **CAMERPAY Processes**: Customer payment
6. **Webhook Confirms**: Payment success (not customer browser)
7. **Backend Updates**: Order + reduces stock
8. **Frontend Shows**: Success page with order details

**The Golden Rule**: Backend controls money. Frontend never touches prices.

---

**Last Updated**: 2024-01-15  
**Status**: Production Ready ✅
