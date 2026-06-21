# CAMERPAY Integration - Complete Setup Checklist ✅

## Backend Setup

### 1. Environment Configuration
- [ ] Add to `.env`:
  ```
  CAMERPAY_API_KEY=your_token_here
  CAMERPAY_SECRET_KEY=your_secret_key_here
  BACKEND_URL=http://localhost:5000
  FRONTEND_URL=http://localhost:3000
  ```

- [ ] Verify `.env.example` has CAMERPAY variables documented

### 2. Files Created/Modified
- [x] ✅ `payment.model.js` - Updated with transaction fields
- [x] ✅ `payment.service.js` - Added order linkage methods
- [x] ✅ `camerpay.service.js` - Full CAMERPAY API integration
- [x] ✅ `payment.controller.js` - CAMERPAY payment handlers
- [x] ✅ `payment.routes.js` - New CAMERPAY endpoints
- [x] ✅ `env.js` - Added CAMERPAY config validation

### 3. Database Indexes (Optional but Recommended)
Run this in MongoDB to optimize queries:
```javascript
db.payments.createIndex({ transactionId: 1 });
db.payments.createIndex({ order: 1 });
db.payments.createIndex({ status: 1 });
db.payments.createIndex({ createdAt: -1 });
```

### 4. Test Backend Endpoints
Using Postman or similar:

```
POST /api/v1/payments/camerpay/initiate
Headers: Authorization: Bearer YOUR_TOKEN
Body:
{
  "orderId": "MONGODB_ID",
  "amount": 5000,
  "phone": "699123456",
  "customerName": "Test User",
  "customerEmail": "test@exemple.cm"
}

Expected: 200 OK with payUrl
```

---

## Frontend Setup

### 1. Create Payment Service
- [ ] Create `src/services/paymentService.ts`
  - [ ] `initiateCamerpayPayment()` method
  - [ ] `verifyPayment()` method
  - [ ] Proper error handling

### 2. Create Checkout Pages
- [ ] `src/pages/CheckoutPage.tsx`
  - [ ] Order summary display
  - [ ] Payment method selection
  - [ ] Phone number input
  - [ ] Redirect to payUrl

- [ ] `src/pages/PaymentSuccessPage.tsx`
  - [ ] Verify payment status
  - [ ] Update order details
  - [ ] Show confirmation message

### 3. Add Routes
- [ ] `/checkout` → CheckoutPage
- [ ] `/payment/success` → PaymentSuccessPage
- [ ] `/payment/cancel` → CancelPage (optional)

### 4. Environment Configuration
- [ ] Create/update `.env`:
  ```
  REACT_APP_API_URL=http://localhost:5000/api/v1
  REACT_APP_CAMERPAY_ENABLED=true
  ```

### 5. UI Components
- [ ] Payment method selector (MTN/Orange)
- [ ] Phone number input with validation
- [ ] Loading spinner during payment
- [ ] Success/failure messages

---

## Testing Checklist

### Unit Tests
- [ ] Payment service methods work correctly
- [ ] Phone number validation works
- [ ] Amount calculation is accurate
- [ ] Order linkage is correct

### Integration Tests
- [ ] Create order → payment flow works
- [ ] Payment webhook updates order status
- [ ] Payment verification returns correct status
- [ ] Email notifications sent on success

### End-to-End Tests
- [ ] User can complete full checkout
- [ ] User redirected to CAMERPAY correctly
- [ ] Success page shows correct information
- [ ] Order status updated after payment
- [ ] Payment shows in admin dashboard

### Edge Cases
- [ ] Invalid phone numbers rejected
- [ ] Duplicate payment attempts handled
- [ ] Network timeout handled gracefully
- [ ] Webhook received twice handled correctly
- [ ] Missing order ID handled
- [ ] Payment status changes persist

---

## API Endpoints Summary

### Payment Endpoints
```
POST   /api/v1/payments/camerpay/initiate
       Initiate payment with CAMERPAY
       
GET    /api/v1/payments/camerpay/verify/:transactionId
       Verify payment status
       
POST   /api/v1/payments/camerpay/webhook
       Webhook callback from CAMERPAY (automatic)
       
POST   /api/v1/payments/camerpay/refund
       Refund a payment
       
GET    /api/v1/payments
       List all payments
       
GET    /api/v1/payments/:id
       Get payment details
```

### Order Endpoints (for reference)
```
POST   /api/v1/orders
       Create new order
       
GET    /api/v1/orders
       List all orders
       
GET    /api/v1/orders/:id
       Get order details
       
PATCH  /api/v1/orders/:id
       Update order
       
DELETE /api/v1/orders/:id
       Delete order
```

---

## Key Configuration Values

| Field | Value | Example |
|-------|-------|---------|
| CAMERPAY Base URL | https://camerpay.biz/api | ✅ Set in code |
| API Endpoint | /payment/initiate | ✅ Set in code |
| Authorization Header | Bearer CAMERPAY_API_KEY | Set in .env |
| Webhook URL | /api/v1/payments/camerpay/webhook | Configure in CAMERPAY dashboard |
| Currency | XAF (Cameroon) | Default in code |
| Amount Format | Whole numbers (5000) | Handled in code |
| Phone Format | 9+ digits | Validated in code |

---

## Deployment Checklist

### Pre-Production
- [ ] All environment variables set correctly
- [ ] Database indexed for performance
- [ ] Error logging configured
- [ ] Email notifications working
- [ ] Webhook signature validation enabled
- [ ] CORS configured for frontend domain
- [ ] HTTPS enforced for all endpoints
- [ ] Rate limiting configured
- [ ] Payment logs stored securely

### Production Deployment
- [ ] Set `NODE_ENV=production`
- [ ] Use production CAMERPAY credentials
- [ ] Set correct FRONTEND_URL and BACKEND_URL
- [ ] Enable request logging
- [ ] Configure monitoring/alerts
- [ ] Backup database before deployment
- [ ] Test payment flow end-to-end
- [ ] Verify webhook delivery

### Post-Deployment
- [ ] Monitor payment success rate
- [ ] Check webhook delivery logs
- [ ] Verify order status updates
- [ ] Test error handling
- [ ] Monitor API response times
- [ ] Check error logs regularly

---

## Monitoring & Troubleshooting

### Key Metrics to Track
- [ ] Payment success rate (target: >95%)
- [ ] Average payment processing time
- [ ] Webhook delivery success rate
- [ ] API response times
- [ ] Error rate

### Common Issues & Fixes

| Issue | Fix | Status |
|-------|-----|--------|
| "Invalid phone" | Phone must be 9+ digits, remove special chars | ✅ Validated in code |
| "Missing order" | Use MongoDB ObjectId, not order number | ✅ Check orderId type |
| "Payment not updating" | Check webhook configuration in CAMERPAY | ⚙️ Manual setup needed |
| "Redirect not working" | Verify payUrl is returned, check localStorage | ✅ Error handling added |
| "Signature validation failed" | Ensure CAMERPAY_SECRET_KEY is correct | ⚙️ Manual setup needed |

---

## Security Checklist

- [ ] HTTPS enforced in production
- [ ] API keys stored in environment variables (not in code)
- [ ] Webhook signature validated
- [ ] Rate limiting on payment endpoints
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Payment amount verified before processing
- [ ] Transaction IDs unique and tracked
- [ ] Error messages don't expose sensitive data
- [ ] Logs don't contain sensitive data

---

## Documentation Files Created

1. **CAMERPAY_ECOMMERCE_FRONTEND_GUIDE.md**
   - Complete frontend implementation
   - React components
   - Service setup
   - Testing guide

2. **CAMERPAY_ORDER_INTEGRATION_SUMMARY.md**
   - How orders and payments integrate
   - Data flow diagrams
   - Complete request/response examples
   - Why order routes are essential

3. **This checklist**
   - Setup steps
   - Testing checklist
   - Deployment guide
   - Monitoring guide

---

## Quick Start (Summary)

### 1. Backend (5 minutes)
```powershell
# Add to .env
CAMERPAY_API_KEY=your_key_here
CAMERPAY_SECRET_KEY=your_secret_here
```

### 2. Frontend (10 minutes)
```powershell
# Create payment service and checkout pages
# See CAMERPAY_ECOMMERCE_FRONTEND_GUIDE.md
```

### 3. Test (5 minutes)
```
POST /api/v1/payments/camerpay/initiate
Expected: payUrl in response
```

### 4. Deploy (varies)
- Set production environment variables
- Run database migrations
- Deploy backend then frontend
- Configure CAMERPAY webhook

---

## Support Resources

- CAMERPAY API Docs: https://camerpay.biz/api
- Implementation Guide: `CAMERPAY_ECOMMERCE_FRONTEND_GUIDE.md`
- Integration Details: `CAMERPAY_ORDER_INTEGRATION_SUMMARY.md`
- Backend Code: `backend/src/modules/payments/`

---

**Status: ✅ READY FOR TESTING**

All backend code is complete and integrated with order system.
Frontend implementation guide provided for development team.
