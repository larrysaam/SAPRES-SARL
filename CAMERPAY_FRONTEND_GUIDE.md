# CAMERPAY Payment Integration - Frontend Implementation Guide

## Overview
This guide explains how to integrate CAMERPAY payments on your client-side application for MTN Mobile Money and Orange Money payments.

---

## Backend API Endpoints (Already Configured)

### 1. Initiate Payment
**Endpoint:** `POST /api/v1/payments/camerpay/initiate`  
**Authentication:** Required (User must be logged in)

**Request Body:**
```json
{
  "amount": 5000,
  "currency": "XAF",
  "phone": "699123456",
  "orderId": "ORDER-12345",
  "customerName": "Jean Dupont",
  "customerEmail": "jean@exemple.cm",
  "returnUrl": "https://yoursite.cm/payment/success",
  "callbackUrl": "https://yoursite.cm/callback"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "transactionId": "uuid-of-transaction",
    "payUrl": "https://camerpay.biz/pay/uuid...",
    "invoiceId": "ORDER-12345",
    "amount": 5000,
    "currency": "XAF",
    "customerName": "Jean Dupont",
    "status": "pending",
    "paymentRecordId": "mongodb-id"
  },
  "message": "CAMERPAY payment initiated successfully"
}
```

### 2. Verify Payment Status
**Endpoint:** `GET /api/v1/payments/camerpay/verify/:transactionId`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "status": "confirmed",
    "transactionId": "uuid-of-transaction",
    "amount": 5000,
    "currency": "XAF",
    "invoiceId": "ORDER-12345"
  },
  "message": "Payment verification completed"
}
```

### 3. Webhook Callback
**Endpoint:** `POST /api/v1/payments/camerpay/webhook`  
**Authentication:** Not required (Called by CAMERPAY server)

CAMERPAY will send webhook when payment status changes.

### 4. Refund Payment
**Endpoint:** `POST /api/v1/payments/camerpay/refund`  
**Authentication:** Required

**Request Body:**
```json
{
  "transactionId": "uuid-of-transaction",
  "amount": 2500
}
```

---

## Frontend Implementation Steps

### Step 1: Create Payment Service

Create `src/services/camerpayService.ts`:

```typescript
import apiClient from './apiClient';

interface CamerpayInitiateRequest {
  amount: number;
  currency?: string;
  phone: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  returnUrl?: string;
  callbackUrl?: string;
}

interface CamerpayInitiateResponse {
  success: boolean;
  transactionId: string;
  payUrl: string;
  invoiceId: string;
  amount: number;
  currency: string;
  customerName: string;
  status: string;
  paymentRecordId: string;
}

interface CamerpayVerifyResponse {
  success: boolean;
  status: string;
  transactionId: string;
  amount: number;
  currency: string;
  invoiceId: string;
}

class CamerpayService {
  /**
   * Initiate a CAMERPAY payment
   * Returns a pay_url to redirect the customer to
   */
  async initiatePayment(paymentData: CamerpayInitiateRequest): Promise<CamerpayInitiateResponse> {
    try {
      const response = await apiClient.post(
        '/payments/camerpay/initiate',
        paymentData
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to initiate payment');
    }
  }

  /**
   * Verify payment status after customer returns from CAMERPAY
   */
  async verifyPayment(transactionId: string): Promise<CamerpayVerifyResponse> {
    try {
      const response = await apiClient.get(
        `/payments/camerpay/verify/${transactionId}`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<any> {
    try {
      const response = await apiClient.post(
        '/payments/camerpay/refund',
        { transactionId, amount }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to refund payment');
    }
  }
}

export default new CamerpayService();
```

---

### Step 2: Create Payment Component

Create `src/components/PaymentModal.tsx`:

```typescript
import React, { useState } from 'react';
import camerpayService from '../services/camerpayService';
import toast from './Toast';

interface PaymentModalProps {
  isOpen: boolean;
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  onSuccess: (transactionId: string) => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  orderId,
  amount,
  customerName,
  customerEmail,
  onSuccess,
  onClose,
}) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    // Validate phone number
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Initiate payment with backend
      const paymentResponse = await camerpayService.initiatePayment({
        amount,
        currency: 'XAF',
        phone,
        orderId,
        customerName,
        customerEmail,
        returnUrl: `${window.location.origin}/payment/success`,
        callbackUrl: `${window.location.origin}/api/v1/payments/camerpay/webhook`,
      });

      if (!paymentResponse.payUrl) {
        throw new Error('No payment URL returned');
      }

      // Step 2: Store transaction ID for later verification
      sessionStorage.setItem('currentPaymentTransaction', paymentResponse.transactionId);
      sessionStorage.setItem('currentPaymentAmount', amount.toString());

      // Step 3: Redirect customer to CAMERPAY payment page
      window.location.href = paymentResponse.payUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Pay with CAMERPAY</h2>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex justify-between mb-2">
              <span>Order ID:</span>
              <span className="font-semibold">{orderId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Customer:</span>
              <span className="font-semibold">{customerName}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-bold">Amount:</span>
              <span className="font-bold text-lg">{amount.toLocaleString()} XAF</span>
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (MTN or Orange)
            </label>
            <input
              type="tel"
              placeholder="ex: 699123456 or +237699123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your MTN Mobile Money or Orange Money phone number
            </p>
          </div>

          {/* Payment Methods Info */}
          <div className="bg-blue-50 p-3 rounded text-sm">
            <p className="font-semibold text-blue-900 mb-2">Supported Payment Methods:</p>
            <ul className="text-blue-800 space-y-1">
              <li>✓ MTN Mobile Money</li>
              <li>✓ Orange Money</li>
            </ul>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 p-3 rounded text-xs text-green-800">
            🔒 Your payment is processed securely by CAMERPAY
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading || !phone}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
```

---

### Step 3: Create Payment Success Page

Create `src/pages/PaymentSuccessPage.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import camerpayService from '../services/camerpayService';
import toast from '../components/Toast';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get transaction ID from URL or session
      const transactionId =
        searchParams.get('transactionId') ||
        sessionStorage.getItem('currentPaymentTransaction');

      if (!transactionId) {
        setError('No transaction ID found');
        setLoading(false);
        return;
      }

      // Verify payment status with backend
      const verification = await camerpayService.verifyPayment(transactionId);

      setPaymentStatus(verification);

      if (verification.success) {
        toast.success('Payment successful!');
        
        // Clear session storage
        sessionStorage.removeItem('currentPaymentTransaction');
        sessionStorage.removeItem('currentPaymentAmount');
        
        // Redirect to orders/dashboard after 3 seconds
        setTimeout(() => {
          navigate('/orders');
        }, 3000);
      } else {
        setError(`Payment ${verification.status}`);
        toast.error(`Payment status: ${verification.status}`);
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {paymentStatus?.success ? (
          <>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-gray-900">{paymentStatus.transactionId.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold">{paymentStatus.amount.toLocaleString()} {paymentStatus.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold">{paymentStatus.invoiceId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {paymentStatus.status}
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 mb-4">
              Redirecting to your dashboard in a few seconds...
            </p>

            <button
              onClick={() => navigate('/orders')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Orders
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Failed</h1>
            </div>

            <p className="text-center text-red-600 mb-6">
              {error || 'An error occurred processing your payment'}
            </p>

            <button
              onClick={() => navigate(-1)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
```

---

### Step 4: Integrate into Order Checkout

Example in `src/pages/OrdersPage.tsx` or checkout component:

```typescript
import React, { useState } from 'react';
import PaymentModal from '../components/PaymentModal';

const OrdersPage: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePaymentClick = (order: any) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    console.log('Payment successful:', transactionId);
    setShowPaymentModal(false);
    // Refresh order data or navigate to success page
  };

  return (
    <div>
      {/* Your orders list */}
      <div className="space-y-4">
        {/* Order items */}
        <button
          onClick={() => handlePaymentClick(order)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Pay with CAMERPAY
        </button>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        orderId={selectedOrder?._id || ''}
        amount={selectedOrder?.total || 0}
        customerName={selectedOrder?.customerName || ''}
        customerEmail={selectedOrder?.customerEmail || ''}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
};

export default OrdersPage;
```

---

### Step 5: Add Routes

Update your router configuration (`src/App.tsx` or router file):

```typescript
import PaymentSuccessPage from './pages/PaymentSuccessPage';

// In your routes array
const routes = [
  // ...existing routes...
  {
    path: '/payment/success',
    element: <PaymentSuccessPage />,
  },
  {
    path: '/payment/cancel',
    element: <div>Payment Cancelled</div>, // Create a proper cancel page
  },
];
```

---

## Complete Payment Flow

```
1. Customer clicks "Pay with CAMERPAY"
                  ↓
2. Payment Modal opens with order details
                  ↓
3. Customer enters phone number (MTN or Orange)
                  ↓
4. Frontend calls: POST /api/v1/payments/camerpay/initiate
                  ↓
5. Backend receives payment request
   - Validates data
   - Calls CAMERPAY API
   - Gets pay_url back
   - Saves payment record (status: pending)
   - Returns transactionId and payUrl
                  ↓
6. Frontend redirects customer to payUrl
   (https://camerpay.biz/pay/uuid...)
                  ↓
7. Customer completes payment on CAMERPAY
   (MTN Mobile Money or Orange Money)
                  ↓
8. CAMERPAY redirects customer back to returnUrl
   (/payment/success?transactionId=uuid...)
                  ↓
9. Frontend calls: GET /api/v1/payments/camerpay/verify/:transactionId
                  ↓
10. Backend verifies with CAMERPAY
    - Gets payment status
    - Updates payment record
    - Returns status
                  ↓
11. Frontend displays success/failure page
    - Saves transaction ID
    - Updates order status
    - Redirects to orders page
                  ↓
12. (Background) CAMERPAY sends webhook to backend
    - Updates payment record
    - Triggers order fulfillment/shipping
```

---

## Environment Variables Required

Add to your frontend `.env`:
```
VITE_API_URL=http://localhost:5000/api/v1
```

And backend `.env`:
```
CAMERPAY_API_TOKEN=your_bearer_token_from_camerpay_dashboard
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

---

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid phone number" | Phone format wrong | Use format: 699123456 or +237699123456 |
| "Missing CAMERPAY token" | Token not configured | Add CAMERPAY_API_TOKEN to .env |
| "Payment not found" | Transaction UUID wrong | Check transactionId in URL |
| "CAMERPAY API error" | CAMERPAY service down | Retry or contact CAMERPAY support |

---

## Testing

### Test Credentials
- **Phone (MTN):** 699123456 (for testing)
- **Phone (Orange):** 666123456 (for testing)
- **Amount:** Any amount in XAF

### Testing Flow
1. Start backend: `npm run dev` in `/backend`
2. Start frontend: `npm run dev` in `/admin`
3. Login to admin dashboard
4. Create/select an order
5. Click "Pay with CAMERPAY"
6. Enter test phone number
7. Complete payment in CAMERPAY test portal
8. Verify payment records in database

---

## Security Best Practices

✅ **Always use HTTPS** in production  
✅ **Validate phone numbers** on both frontend and backend  
✅ **Never expose API tokens** in frontend code  
✅ **Store transaction IDs securely** (sessionStorage only, not localStorage for sensitive data)  
✅ **Verify webhooks** from CAMERPAY  
✅ **Rate limit** payment endpoints  
✅ **Encrypt sensitive data** in database  

---

## Support

- CAMERPAY Documentation: https://camerpay.biz/api
- Dashboard: https://camerpay.biz/dashboard
- Support Email: support@camerpay.biz

