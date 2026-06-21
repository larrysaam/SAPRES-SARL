# CAMERPAY + E-Commerce Order Integration Summary

## Yes, the Order Routes are ESSENTIAL ✅

The payment system is fully integrated with the order system. Here's how they work together:

---

## Data Flow: Order → Payment → Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER JOURNEY                                                │
└─────────────────────────────────────────────────────────────────┘

1. CHECKOUT
   Customer fills form:
   - Items
   - Shipping address
   - Phone number
   - Payment method preference
   
   ↓ Clicks "Place Order"
   
2. CREATE ORDER
   POST /api/v1/orders
   ├─ Saves order to database (status: pending, paymentStatus: pending)
   ├─ Creates orderNumber (e.g., "ORD-20240121-001")
   ├─ Calculates total = subtotal + deliveryFee
   └─ Returns Order ID (_id)
   
   ↓
   
3. INITIATE PAYMENT  
   POST /api/v1/payments/camerpay/initiate
   ├─ Takes Order ID
   ├─ Creates Payment record linked to Order
   ├─ Calls CAMERPAY API with:
   │   - merchant_invoice_id: order.orderNumber
   │   - amount: order.total
   │   - phone: customer.phone
   │   - customer_name: customer.name
   │   - customer_email: customer.email
   ├─ Receives transaction_uuid from CAMERPAY
   ├─ Saves transaction_uuid to Payment.transactionId
   └─ Returns pay_url
   
   ↓ Frontend stores: transactionId, orderId in localStorage
   
4. REDIRECT TO PAYMENT
   window.location.href = pay_url
   → Customer directed to CAMERPAY payment page
   
   ↓
   
5. CUSTOMER PAYS ON CAMERPAY
   Customer enters USSD/Mobile Money PIN
   CAMERPAY processes payment
   
   ↓ Payment status changes on CAMERPAY
   
6. WEBHOOK CALLBACK (Automatic)
   CAMERPAY sends POST to backend:
   POST /api/v1/payments/camerpay/webhook
   {
     "transaction_uuid": "uuid...",
     "merchant_invoice_id": "ORD-20240121-001",
     "status": "confirmed",
     "amount": 5000,
     "customer_phone": "699123456"
   }
   
   Backend processes:
   ├─ Finds Payment by transactionId
   ├─ Updates Payment.status = "successful"
   ├─ Finds linked Order
   ├─ Updates Order.paymentStatus = "paid"
   ├─ Updates Order.orderStatus = "processing"
   └─ Sends confirmation email to customer
   
   ↓
   
7. REDIRECT TO SUCCESS
   Customer automatically redirected to:
   /payment/success?transactionId=uuid
   
   Frontend verifies:
   ├─ Calls GET /api/v1/payments/camerpay/verify/:transactionId
   ├─ Checks payment status = "successful"
   ├─ Fetches updated Order data
   ├─ Shows confirmation message
   └─ Customer can view Order details
   
   ↓
   
8. ORDER FULFILLMENT
   Merchant receives notification
   Prepares order for shipping
   Updates order status: "processing" → "delivered"
```

---

## Database Relationships

```
Order Document
{
  _id: ObjectId("..."),
  orderNumber: "ORD-20240121-001",
  customerName: "Jean Dupont",
  customerPhone: "699123456",
  customerEmail: "jean@exemple.cm",
  deliveryAddress: "Douala, Cameroon",
  items: [
    {
      product: ObjectId("..."),
      productName: "Product A",
      quantity: 2,
      unitPrice: 2000,
      totalPrice: 4000
    }
  ],
  subtotal: 4000,
  deliveryFee: 500,
  total: 4500,
  paymentMethod: "mtn",
  paymentStatus: "pending" → "paid" (updated by webhook)
  orderStatus: "pending" → "processing" (updated by webhook)
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}

          ↓ (referenced by Payment)

Payment Document
{
  _id: ObjectId("..."),
  order: ObjectId("..."),  ← Links back to Order
  provider: "camerpay",
  amount: 4500,
  currency: "XAF",
  transactionId: "uuid-from-camerpay",  ← From CAMERPAY
  transactionReference: "ORD-20240121-001",  ← Order number
  paymentMethod: "mtn",
  status: "pending" → "successful" (updated by webhook)
  paymentUrl: "https://camerpay.biz/pay/uuid...",
  customerPhone: "699123456",
  customerEmail: "jean@exemple.cm",
  customerName: "Jean Dupont",
  rawResponse: { /* CAMERPAY API response */ },
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## API Endpoints Used

### Order Service
```
POST   /api/v1/orders                 → Create order
GET    /api/v1/orders                 → List orders
GET    /api/v1/orders/:id             → Get order details
PATCH  /api/v1/orders/:id             → Update order status
DELETE /api/v1/orders/:id             → Delete order
```

### Payment Service
```
POST   /api/v1/payments/camerpay/initiate          → Start payment
GET    /api/v1/payments/camerpay/verify/:txId      → Check status
POST   /api/v1/payments/camerpay/webhook           → CAMERPAY callback
POST   /api/v1/payments/camerpay/refund            → Refund payment
GET    /api/v1/payments                            → List payments
GET    /api/v1/payments/:id                        → Get payment details
```

---

## Frontend Integration Points

### 1. Cart → Checkout
```tsx
// In cart/checkout component
function handleCheckout() {
  // Step 1: Create order
  const order = await orderService.createOrder({
    customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    items: cartItems,
    subtotal: calculateSubtotal(cartItems),
    deliveryFee: 500,
    total: calculateTotal(cartItems, 500),
  });
  
  // Step 2: Redirect to payment page with orderId
  navigate(`/checkout?orderId=${order._id}`);
}
```

### 2. Checkout Page
```tsx
// In CheckoutPage component
async function handlePayment() {
  // Step 1: Fetch order details
  const order = await orderService.getOrderById(orderId);
  
  // Step 2: Initiate payment
  const payment = await paymentService.initiateCamerpayPayment({
    orderId: order._id,  // MongoDB ID
    amount: order.total,
    phone: formData.phone,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
  });
  
  // Step 3: Store and redirect
  localStorage.setItem('transactionId', payment.data.transactionId);
  localStorage.setItem('orderId', orderId);
  window.location.href = payment.data.payUrl;
}
```

### 3. Payment Success Verification
```tsx
// In PaymentSuccessPage component
useEffect(() => {
  async function verifyPayment() {
    const transactionId = localStorage.getItem('transactionId');
    const orderId = localStorage.getItem('orderId');
    
    // Step 1: Verify payment with backend
    const payment = await paymentService.verifyPayment(transactionId);
    
    // Step 2: Fetch updated order (paymentStatus should be 'paid')
    const order = await orderService.getOrderById(orderId);
    
    // Step 3: Show success with order details
    if (order.paymentStatus === 'paid') {
      showSuccess('Payment confirmed!');
    }
    
    // Step 4: Clean up
    localStorage.removeItem('transactionId');
    localStorage.removeItem('orderId');
  }
  
  verifyPayment();
}, []);
```

---

## Backend Service Integration

### Payment Service with Order Updates
```javascript
// When payment is successful
async updateByTransactionId(transactionId, payload) {
  // Update payment
  const payment = await Payment.findOneAndUpdate(
    { transactionId },
    payload,
    { new: true }
  ).populate('order');
  
  // Update related order
  if (payload.status === 'successful' && payment.order) {
    await Order.findByIdAndUpdate(payment.order._id, {
      paymentStatus: 'paid',
      orderStatus: 'processing',  // Start fulfillment
    });
    
    // Send email to customer
    await sendOrderConfirmationEmail(payment.order);
    
    // Notify merchant
    await notifyMerchant(payment.order);
  }
  
  return payment;
}
```

---

## Complete Request/Response Examples

### Example 1: Create Order
```
POST /api/v1/orders
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "customerName": "Jean Dupont",
  "customerPhone": "699123456",
  "customerEmail": "jean@exemple.cm",
  "deliveryAddress": "Douala, Cameroon",
  "items": [
    {
      "product": "507f1f77bcf86cd799439011",
      "productName": "Laptop",
      "quantity": 1,
      "unitPrice": 500000,
      "totalPrice": 500000
    }
  ],
  "subtotal": 500000,
  "deliveryFee": 2000,
  "total": 502000,
  "paymentMethod": "mtn"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72e8c8e4a1b",
    "orderNumber": "ORD-20240121-001",
    "customerName": "Jean Dupont",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "total": 502000,
    ...
  }
}
```

### Example 2: Initiate CAMERPAY Payment
```
POST /api/v1/payments/camerpay/initiate
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "orderId": "60d5ec49f1b2c72e8c8e4a1b",
  "amount": 502000,
  "phone": "699123456",
  "customerName": "Jean Dupont",
  "customerEmail": "jean@exemple.cm"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "paymentId": "60d5ec49f1b2c72e8c8e4a2c",
    "payUrl": "https://camerpay.biz/pay/a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "transactionId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "amount": 502000,
    "currency": "XAF",
    "status": "pending",
    "message": "Payment initiated. Redirect customer to payUrl..."
  }
}
```

### Example 3: CAMERPAY Webhook Callback
```
POST /api/v1/payments/camerpay/webhook
Content-Type: application/json

{
  "transaction_uuid": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "merchant_invoice_id": "ORD-20240121-001",
  "status": "confirmed",
  "amount": 502000,
  "currency": "XAF",
  "customer_phone": "699123456",
  "created_at": "2024-01-21T12:30:45Z"
}

Backend automatically:
1. Updates Payment.status → "successful"
2. Updates Order.paymentStatus → "paid"
3. Updates Order.orderStatus → "processing"
4. Sends confirmation email
5. Notifies merchant
```

### Example 4: Verify Payment Status
```
GET /api/v1/payments/camerpay/verify/a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
Authorization: Bearer TOKEN

Response (200 OK):
{
  "success": true,
  "data": {
    "success": true,
    "status": "confirmed",
    "transactionId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "amount": 502000,
    "currency": "XAF",
    "invoiceId": "ORD-20240121-001"
  }
}
```

---

## Summary: Why Order Routes Are NOT Useless ✅

| Function | Usage | Why Important |
|----------|-------|---------------|
| **Create Order** | First step of checkout | Creates the order before payment |
| **Get Order** | Fetch details for payment | Links order data to payment |
| **Update Order** | Webhook updates status | Changes order to "paid" after payment |
| **List Orders** | Customer order history | Shows completed purchases |
| **Delete Order** | Admin cleanup | Remove test/cancelled orders |

The **order and payment systems are tightly integrated**:
1. Order is created **first**
2. Payment is linked to order via `payment.order = orderId`
3. When payment succeeds, **order is automatically updated**
4. Customer sees order status based on payment status

**They work together as one e-commerce system! 🎯**

