# Payment Flow Testing Guide

This guide helps you test the complete guest checkout and payment system end-to-end.

## Prerequisites

1. Backend running on `http://localhost:5000`
2. MongoDB database accessible
3. Test product in database
4. CAMERPAY API token configured in `.env`

## Phase 1: Product Setup

Before creating an order, ensure you have a product in the database.

### Get Products (or create one)

```bash
curl -X GET "http://localhost:5000/api/v1/products"
```

If no products exist, create one via your admin panel or use the API.

**Sample Product to Add (via MongoDB):**
```json
{
  "name": "Test Phone Case",
  "sku": "CASE-001",
  "description": "Protective phone case",
  "price": 15000,
  "discountPrice": null,
  "stock": 100,
  "category": "Accessories",
  "images": [
    {
      "url": "https://example.com/phone-case.jpg",
      "secureUrl": "https://example.com/phone-case.jpg"
    }
  ],
  "active": true
}
```

## Phase 2: Create Order (Guest Checkout)

### Step 1: Create a New Order (POST /api/v1/orders)

**NO AUTHENTICATION REQUIRED** - This is a guest checkout!

```bash
curl -X POST "http://localhost:5000/api/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "PRODUCT_ID_HERE",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "fullName": "John Doe",
      "phone": "+237123456789",
      "email": "john@example.com",
      "address": "123 Main Street",
      "city": "Douala",
      "region": "Littoral",
      "country": "Cameroon"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "ORDER_ID_HERE",
    "orderNumber": "ORD-1234567890-1",
    "items": [...],
    "subtotal": 30000,
    "tax": 5775,
    "shippingCost": 2500,
    "totalAmount": 38275,
    "status": "PENDING_PAYMENT",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+237123456789"
  },
  "message": "Order created successfully"
}
```

**Save the returned `_id` and `orderNumber`** - you'll need them next.

---

## Phase 3: Initiate Payment

### Step 2: Initiate CAMERPAY Payment (POST /api/v1/payments/camerpay/initiate)

```bash
curl -X POST "http://localhost:5000/api/v1/payments/camerpay/initiate" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID_HERE",
    "paymentMethod": "mtn_money"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "success": true,
    "paymentUrl": "https://pay.camerpay.com/...",
    "transactionReference": "PAY-1234567890-ABCDEF",
    "orderId": "ORDER_ID_HERE",
    "orderNumber": "ORD-1234567890-1",
    "amount": 38275,
    "currency": "XAF"
  },
  "message": "Payment initiated successfully"
}
```

**Save the `paymentUrl` and `transactionReference`** for testing.

---

## Phase 4: Test Payment Status Checks

### Option A: Manual Status Check (for testing during development)

```bash
curl -X POST "http://localhost:5000/api/v1/payments/camerpay/check-status/TRANSACTION_UUID_HERE"
```

This endpoint:
- Checks payment status with CAMERPAY
- Updates order status to `PAID` if confirmed
- Reduces product stock
- Returns updated status

### Option B: Verify via Transaction Reference

```bash
curl -X GET "http://localhost:5000/api/v1/payments/camerpay/verify/PAY-1234567890-ABCDEF"
```

---

## Phase 5: Verify Order Status Updates

### Get Order Details (to verify status changed to PAID)

```bash
curl -X GET "http://localhost:5000/api/v1/orders/ORDER_ID_HERE"
```

**Expected after successful payment:**
```json
{
  "success": true,
  "data": {
    "_id": "ORDER_ID_HERE",
    "status": "PAID",        // ✅ Changed from PENDING_PAYMENT
    "payment": {
      "status": "PAID",      // ✅ Also updated
      "method": "mtn_money"
    },
    "paidAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Phase 6: Verify Stock Reduction

### Check Product Stock

```bash
curl -X GET "http://localhost:5000/api/v1/products/PRODUCT_ID_HERE"
```

**Expected:**
- Stock should be reduced by the quantity ordered
- If initial stock was 100 and you ordered 2, it should now be 98

---

## Webhook Testing (Advanced)

### Simulate CAMERPAY Webhook

If webhook is not auto-triggering, you can manually test it:

```bash
curl -X POST "http://localhost:5000/api/v1/payments/camerpay/webhook" \
  -H "Content-Type: application/json" \
  -H "x-camerpay-signature: test_signature" \
  -d '{
    "transaction_uuid": "CAMERPAY_UUID_HERE",
    "status": "completed",
    "merchant_invoice_id": "ORD-1234567890-1",
    "amount": 38275,
    "currency": "XAF",
    "payment_method": "mtn_money"
  }'
```

---

## Complete Checklist

After running the full flow, verify:

- [ ] Order created with `PENDING_PAYMENT` status
- [ ] Order number auto-generated as `ORD-{timestamp}-{count}`
- [ ] Order total calculated correctly: subtotal + tax + shipping
- [ ] Payment record created in database
- [ ] Payment URL returned (can redirect customer to pay)
- [ ] After payment confirmed:
  - [ ] Order status changed to `PAID`
  - [ ] Payment status changed to `SUCCESS`
  - [ ] Product stock reduced by quantity ordered
  - [ ] `paidAt` timestamp set on order

---

## Common Issues & Solutions

### ❌ "Guest checkout requires: fullName, phone, and email"
- Solution: Ensure shippingAddress includes all three fields

### ❌ "Order not found" when initiating payment
- Solution: Use the exact `_id` returned from order creation, not orderNumber

### ❌ "Cannot pay for order with status: PAID"
- Solution: You're trying to pay twice - create a new order first

### ❌ "Payment not found for transaction"
- Solution: Transaction UUID doesn't exist - check CAMERPAY response

### ❌ Order status not changing to PAID
- Solution: 
  1. Check webhook logs in backend console
  2. Use manual check-status endpoint to trigger update
  3. Verify CAMERPAY payment was actually confirmed

### ❌ Stock not reducing
- Solution:
  1. Check if payment marked as SUCCESS
  2. Verify product IDs are correct
  3. Check backend logs for stock reduction errors

---

## Debugging Tips

### Enable Verbose Logging

In `payment.controller.js`, all webhook data is logged:

```
🔔 ========== WEBHOOK RECEIVED ==========
Timestamp: 2024-01-15T10:30:00Z
Webhook data: { ... }
```

Check your backend console for these logs.

### Database Inspection

Check order and payment records directly in MongoDB:

```javascript
// Check order
db.orders.findOne({ orderNumber: "ORD-1234567890-1" })

// Check payment
db.payments.findOne({ transactionReference: "PAY-1234567890-ABCDEF" })

// Check product stock
db.products.findOne({ sku: "CASE-001" })
```

### Payment Timeline

Every payment record tracks:
- `initiatedAt` - When payment was created
- `paidAt` - When webhook confirmed success
- `webhookReceivedAt` - When webhook was processed
- `failedAt` - If payment failed

---

## Next Steps

1. **Test the flow manually** using the curl commands above
2. **Check backend console logs** for detailed processing info
3. **If webhook doesn't trigger**, use the manual check-status endpoint
4. **Build frontend** to integrate with these APIs
5. **Set up email notifications** for order confirmations
