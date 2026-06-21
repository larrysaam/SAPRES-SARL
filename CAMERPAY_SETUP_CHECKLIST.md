# CAMERPAY Integration - Setup Checklist

## Backend Setup ✅

### 1. Configuration Files Updated
- [x] `backend/src/modules/payments/camerpay.service.js` - Created with CAMERPAY API integration
- [x] `backend/src/modules/payments/payment.controller.js` - Added CAMERPAY handlers
- [x] `backend/src/modules/payments/payment.routes.js` - Added CAMERPAY routes
- [x] `backend/src/config/env.js` - Added CAMERPAY environment variables
- [x] `backend/.env.example` - Updated with CAMERPAY token

### 2. Environment Setup
```bash
# 1. Get API Token from CAMERPAY Dashboard
# https://camerpay.biz/dashboard/settings

# 2. Add to backend/.env
CAMERPAY_API_TOKEN=your_bearer_token_here
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# 3. Restart backend server
npm run dev
```

### 3. API Endpoints Ready
- [x] `POST /api/v1/payments/camerpay/initiate` - Start payment
- [x] `GET /api/v1/payments/camerpay/verify/:transactionId` - Check status
- [x] `POST /api/v1/payments/camerpay/webhook` - Receive CAMERPAY updates
- [x] `POST /api/v1/payments/camerpay/refund` - Refund payment

---

## Frontend Setup (TODO)

### 1. Create Payment Service
**Location:** `admin/src/services/camerpayService.ts`

Copy from `CAMERPAY_FRONTEND_GUIDE.md` - Step 1

### 2. Create Payment Modal Component
**Location:** `admin/src/components/PaymentModal.tsx`

Copy from `CAMERPAY_FRONTEND_GUIDE.md` - Step 2

### 3. Create Success Page
**Location:** `admin/src/pages/PaymentSuccessPage.tsx`

Copy from `CAMERPAY_FRONTEND_GUIDE.md` - Step 3

### 4. Update Routes
**Location:** `admin/src/App.tsx` or router configuration

Add:
```typescript
{
  path: '/payment/success',
  element: <PaymentSuccessPage />,
},
{
  path: '/payment/cancel',
  element: <CancelPage />,
}
```

### 5. Integrate into Order Checkout
Update your orders/checkout page to use `<PaymentModal />`

---

## Testing Checklist

### Backend Testing
- [ ] Backend server runs without errors: `npm run dev`
- [ ] Verify env variables are loaded: Check console output
- [ ] Test endpoint manually with Postman:
  ```
  POST http://localhost:5000/api/v1/payments/camerpay/initiate
  Headers: Authorization: Bearer {token}
  Body: { amount: 5000, currency: "XAF", phone: "699123456", ... }
  ```

### Frontend Testing
- [ ] Payment service imports correctly
- [ ] Payment modal displays
- [ ] Phone number validation works
- [ ] Click "Pay Now" button
- [ ] Redirected to CAMERPAY payment page
- [ ] Complete test payment
- [ ] Redirected back to `/payment/success`
- [ ] Payment status shows "confirmed" or "success"

### End-to-End Testing
- [ ] Create order in frontend
- [ ] Open payment modal
- [ ] Enter phone number (699123456 or 666123456 for testing)
- [ ] Complete payment on CAMERPAY
- [ ] Verify payment shows in database
- [ ] Verify order status updates
- [ ] Verify webhook was received (check backend logs)

---

## Configuration Files Reference

### Backend .env
```env
NODE_ENV=development
PORT=5000
MONGODB_URL=mongodb://localhost:27017/sapres-sarl

# CAMERPAY Configuration
CAMERPAY_API_TOKEN=your_bearer_token_here
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

### Frontend .env
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## API Response Examples

### Success Response (Initiate Payment)
```json
{
  "success": true,
  "data": {
    "success": true,
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "payUrl": "https://camerpay.biz/pay/550e8400-e29b-41d4-a716-446655440000",
    "invoiceId": "ORDER-12345",
    "amount": 5000,
    "currency": "XAF",
    "customerName": "Jean Dupont",
    "status": "pending",
    "paymentRecordId": "507f1f77bcf86cd799439011"
  },
  "message": "CAMERPAY payment initiated successfully"
}
```

### Success Response (Verify Payment)
```json
{
  "success": true,
  "data": {
    "success": true,
    "status": "confirmed",
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 5000,
    "currency": "XAF",
    "invoiceId": "ORDER-12345"
  },
  "message": "Payment verification completed"
}
```

---

## Troubleshooting

### "CAMERPAY_API_TOKEN not configured"
```bash
# Check .env file has the token
echo $CAMERPAY_API_TOKEN

# Restart backend after adding token
npm run dev
```

### "Invalid phone number"
```
Valid formats:
- 699123456 (local format)
- +237699123456 (international format)
- 0699123456 (with leading zero)

Invalid:
- 99123456 (too short)
- (699) 123-456 (with formatting)
```

### "Transaction not found"
- Check that transactionId is correct
- Verify payment was initiated with correct API token
- Check CAMERPAY dashboard to see if payment exists

### "Webhook not received"
- Verify BACKEND_URL is correct and accessible from internet
- Check firewall rules
- Check CAMERPAY dashboard webhook settings
- Test webhook manually in CAMERPAY dashboard

---

## Security Checklist

- [ ] API token stored in .env (not in code)
- [ ] HTTPS used in production
- [ ] Phone numbers validated on backend
- [ ] Payment amounts validated before processing
- [ ] Transaction IDs verified before updating orders
- [ ] Webhooks from CAMERPAY validated
- [ ] Sensitive data not logged
- [ ] Rate limiting enabled on payment endpoints
- [ ] Payment records encrypted in database
- [ ] User authentication required for payment endpoint

---

## Files Summary

### Backend Files
- `camerpay.service.js` - CAMERPAY API integration
- `payment.controller.js` - HTTP handlers
- `payment.routes.js` - Express routes
- `payment.model.js` - MongoDB schema (already exists)
- `payment.service.js` - Database operations (already exists)

### Frontend Files (To Create)
- `camerpayService.ts` - API client
- `PaymentModal.tsx` - Payment UI component
- `PaymentSuccessPage.tsx` - Success page
- Router configuration updates

### Documentation Files
- `CAMERPAY_FRONTEND_GUIDE.md` - Complete frontend implementation guide
- `CAMERPAY_SETUP_CHECKLIST.md` - This file

---

## Next Steps

1. **Backend:**
   - [ ] Add CAMERPAY_API_TOKEN to .env
   - [ ] Restart backend server
   - [ ] Test with Postman or curl

2. **Frontend:**
   - [ ] Create camerpayService.ts
   - [ ] Create PaymentModal.tsx
   - [ ] Create PaymentSuccessPage.tsx
   - [ ] Update routes
   - [ ] Integrate payment modal into orders page

3. **Testing:**
   - [ ] Test full payment flow
   - [ ] Verify webhook receipts
   - [ ] Check database records

4. **Deployment:**
   - [ ] Update production .env files
   - [ ] Test in staging environment
   - [ ] Configure CAMERPAY webhook URLs for production
   - [ ] Deploy to production

---

## Quick Start Commands

```bash
# Backend
cd backend
npm install  # if needed
npm run dev

# Frontend
cd admin
npm install  # if needed
npm run dev
```

Then open http://localhost:3000 and test payment flow!

---

**Status:** ✅ Backend ready | ⏳ Frontend ready (guide provided)
**Last Updated:** June 21, 2026
**Support:** See CAMERPAY_FRONTEND_GUIDE.md for detailed implementation

