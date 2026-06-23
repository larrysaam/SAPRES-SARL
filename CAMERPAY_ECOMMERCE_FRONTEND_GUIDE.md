# CAMERPAY Integration - E-Commerce Frontend Implementation Guide

## Overview
This guide shows you how to integrate CAMERPAY payments into your e-commerce client site for MTN Mobile Money and Orange Money payments.

## Architecture

```
Customer Order Flow:
1. Customer creates order (saves to database with status: pending)
2. Frontend calls: POST /api/v1/payments/camerpay/initiate
3. Backend initiates CAMERPAY payment → returns payUrl
4. Frontend redirects customer to CAMERPAY payUrl
5. Customer completes payment on CAMERPAY
6. CAMERPAY sends webhook to backend → Payment status updated
7. Customer redirected back to success page
```

## Backend API Endpoints

### 1. Initiate Payment
**POST** `/api/v1/payments/camerpay/initiate`

**Request Body:**
```json
{
  "orderId": "MongoDB_ORDER_ID",
  "amount": 5000,
  "currency": "XAF",
  "phone": "699123456",
  "customerName": "Jean Dupont",
  "customerEmail": "jean@exemple.cm",
  "returnUrl": "https://yoursite.cm/payment/success",
  "callbackUrl": "https://yoursite.cm/api/v1/payments/camerpay/webhook"
}
```


**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "PAYMENT_ID",
    "payUrl": "https://camerpay.biz/pay/uuid...",
    "transactionId": "uuid-from-camerpay",
    "amount": 5000,
    "currency": "XAF",
    "status": "pending",
    "message": "Payment initiated. Redirect customer to payUrl to complete payment."
  }
}
```

### 2. Verify Payment Status
**GET** `/api/v1/payments/camerpay/verify/:transactionId`

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "status": "confirmed",
    "transactionId": "uuid...",
    "amount": 5000,
    "currency": "XAF",
    "invoiceId": "ORDER-12345"
  }
}
```

### 3. Webhook Callback
**POST** `/api/v1/payments/camerpay/webhook`

CAMERPAY sends this automatically when payment status changes. No frontend action needed.

---

## Frontend Implementation

### Step 1: Create Payment Service

```typescript
// frontend/src/services/paymentService.ts

import apiClient from './apiClient';
import type { Order } from '../types';

interface InitiatePaymentRequest {
  orderId: string;
  amount: number;
  phone: string;
  customerName: string;
  customerEmail: string;
  currency?: string;
  returnUrl?: string;
  callbackUrl?: string;
}

interface InitiatePaymentResponse {
  success: boolean;
  data: {
    paymentId: string;
    payUrl: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
  };
}

interface VerifyPaymentResponse {
  success: boolean;
  data: {
    success: boolean;
    status: string;
    transactionId: string;
    amount: number;
    currency: string;
    invoiceId: string;
  };
}

const paymentService = {
  /**
   * Initiate CAMERPAY payment
   */
  async initiateCamerpayPayment(
    request: InitiatePaymentRequest
  ): Promise<InitiatePaymentResponse> {
    const response = await apiClient.post('/payments/camerpay/initiate', {
      orderId: request.orderId,
      amount: request.amount,
      phone: request.phone,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      currency: request.currency || 'XAF',
      returnUrl: request.returnUrl || `${window.location.origin}/payment/success`,
      callbackUrl: request.callbackUrl || `${process.env.REACT_APP_API_URL}/payments/camerpay/webhook`,
    });

    return response.data;
  },

  /**
   * Verify payment status
   */
  async verifyPayment(transactionId: string): Promise<VerifyPaymentResponse> {
    const response = await apiClient.get(
      `/payments/camerpay/verify/${transactionId}`
    );
    return response.data;
  },

  /**
   * Get payment details by transaction ID
   */
  async getPaymentDetails(transactionId: string) {
    const response = await apiClient.get(
      `/payments?transactionId=${transactionId}`
    );
    return response.data;
  },
};

export default paymentService;
```

### Step 2: Create Payment/Checkout Component

```tsx
// frontend/src/pages/CheckoutPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import paymentService from '../services/paymentService';
import orderService from '../services/orderService';
import toast from '../components/Toast';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'review' | 'payment'>('review');
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'orange'>('mtn');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Get order from URL or state
  const orderId = new URLSearchParams(window.location.search).get('orderId');

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderId ? orderService.getOrderById(orderId) : null,
    enabled: !!orderId,
  });

  const order = orderData?.data;

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) {
      toast.error('Order not found');
      return;
    }

    if (!phone || phone.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Initiate payment with CAMERPAY
      const paymentResponse = await paymentService.initiateCamerpayPayment({
        orderId: order._id,
        amount: order.total,
        phone,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        currency: 'XAF',
      });

      if (!paymentResponse.success || !paymentResponse.data.payUrl) {
        toast.error('Failed to initiate payment');
        return;
      }

      // Step 2: Store transaction ID for later verification
      localStorage.setItem('transactionId', paymentResponse.data.transactionId);
      localStorage.setItem('orderId', order._id);

      // Step 3: Redirect to CAMERPAY payment URL
      toast.success('Redirecting to CAMERPAY...');
      
      // Delay redirect slightly to ensure localStorage is saved
      setTimeout(() => {
        window.location.href = paymentResponse.data.payUrl;
      }, 1000);

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (orderLoading) {
    return <div className="p-8">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="p-8">
        <p className="text-red-600">Order not found</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Go to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {step === 'review' && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <p><strong>Order #:</strong> {order.orderNumber}</p>
              <p><strong>Customer:</strong> {order.customerName}</p>
              <p><strong>Email:</strong> {order.customerEmail}</p>
              <p><strong>Phone:</strong> {order.customerPhone}</p>
              <p><strong>Address:</strong> {order.deliveryAddress}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold mb-2">Items:</h3>
              <div className="space-y-2 text-sm">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.productName} x{item.quantity}</span>
                    <span>{item.totalPrice.toLocaleString()} XAF</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{order.subtotal.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>{order.deliveryFee.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{order.total.toLocaleString()} XAF</span>
              </div>
            </div>

            <button
              onClick={() => setStep('payment')}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              Proceed to Payment
            </button>
          </div>

          {/* Order Details */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Delivery Info</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p className="font-semibold">{order.deliveryAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold capitalize">{order.orderStatus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className={`font-semibold capitalize ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {order.paymentStatus}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="max-w-md mx-auto border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

          <form onSubmit={handleInitiatePayment} className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="699123456"
                pattern="[0-9\s\-\+]+"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Enter your MTN or Orange phone number
              </p>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Payment Provider
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mtn"
                    checked={paymentMethod === 'mtn'}
                    onChange={(e) => setPaymentMethod('mtn' as 'mtn' | 'orange')}
                    className="mr-3"
                  />
                  <span className="flex-1 font-semibold">MTN Mobile Money</span>
                  <span className="text-green-600">🟢</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="orange"
                    checked={paymentMethod === 'orange'}
                    onChange={(e) => setPaymentMethod('orange' as 'mtn' | 'orange')}
                    className="mr-3"
                  />
                  <span className="flex-1 font-semibold">Orange Money</span>
                  <span className="text-orange-600">🟠</span>
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                CAMERPAY supports both payment methods
              </p>
            </div>

            {/* Amount Display */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Amount to Pay</p>
              <p className="text-2xl font-bold">
                {order.total.toLocaleString()} XAF
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Processing...' : 'Pay with CAMERPAY'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep('review')}
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 disabled:bg-gray-400 transition-colors"
            >
              Back
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-2">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Pay with CAMERPAY"</li>
              <li>You'll be redirected to CAMERPAY</li>
              <li>Complete payment using your phone</li>
              <li>You'll be redirected back after payment</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
```

### Step 3: Create Payment Success/Failure Pages

```tsx
// frontend/src/pages/PaymentSuccessPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import paymentService from '../services/paymentService';
import orderService from '../services/orderService';
import toast from '../components/Toast';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get stored IDs from localStorage
        const transactionId = localStorage.getItem('transactionId');
        const orderId = localStorage.getItem('orderId');

        if (!transactionId || !orderId) {
          toast.error('Payment information not found');
          navigate('/orders');
          return;
        }

        // Verify payment status with backend
        const verifyResponse = await paymentService.verifyPayment(transactionId);

        if (verifyResponse.success) {
          toast.success('Payment confirmed!');
          setOrderStatus('paid');

          // Get updated order details
          const orderResponse = await orderService.getOrderById(orderId);
          if (orderResponse.data.paymentStatus === 'paid') {
            setOrderStatus('paid');
          }
        } else {
          toast.warning('Payment status is pending. Please check back soon.');
          setOrderStatus('pending');
        }

        // Clear localStorage
        localStorage.removeItem('transactionId');
        localStorage.removeItem('orderId');

      } catch (error: any) {
        console.error('Verification error:', error);
        toast.error('Failed to verify payment');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [navigate]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
          </div>
          <p className="text-lg font-semibold">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          {orderStatus === 'paid' ? (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">
                Payment Confirmed!
              </h1>
              <p className="text-gray-600">
                Your order has been successfully paid. You will receive an email confirmation shortly.
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">⏳</div>
              <h1 className="text-2xl font-bold text-orange-600 mb-2">
                Payment Pending
              </h1>
              <p className="text-gray-600">
                Your payment is being processed. Please check your order status soon.
              </p>
            </>
          )}
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate('/orders')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            View My Orders
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
```

### Step 4: Add Routes

```tsx
// frontend/src/App.tsx or router setup

import CheckoutPage from './pages/CheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

const routes = [
  // ... other routes
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/payment/success',
    element: <PaymentSuccessPage />,
  },
];
```

### Step 5: Update Order Model Relationship

Make sure your Order model includes payment reference:

```typescript
// frontend/src/types/index.ts

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'mtn' | 'orange' | 'whatsapp';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  order: string | Order;
  provider: 'cinetpay' | 'camerpay' | 'mtn' | 'orange';
  amount: number;
  currency: string;
  transactionId: string;
  transactionReference: string;
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  paymentUrl: string;
  paymentMethod: 'mtn' | 'orange';
  customerPhone: string;
  customerEmail: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Testing Checklist

- [ ] **Test Payment Initiation**
  - Create order → Click Pay → Verify payUrl is correct
  - Check that order ID is properly linked to payment

- [ ] **Test Phone Validation**
  - Try invalid phone numbers → Should show error
  - Try valid phone numbers → Should proceed

- [ ] **Test Payment Redirect**
  - Click "Pay with CAMERPAY" → Should redirect to CAMERPAY
  - Check localStorage has transactionId and orderId

- [ ] **Test Success Callback**
  - Complete payment on CAMERPAY → Should redirect back
  - Should verify payment status → Show success message
  - Order paymentStatus should be updated to 'paid'

- [ ] **Test Payment Verification**
  - GET /payments/camerpay/verify/:transactionId → Returns correct status

- [ ] **Test Webhook**
  - CAMERPAY webhook sent → Order updated to paid
  - Payment status changed in database

---

## Environment Variables

Add to `.env` (frontend):

```
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_CAMERPAY_ENABLED=true
```

---

## Key Points

1. **Always use orderId** from MongoDB, not order number
2. **Phone number** should include country code (e.g., 237 for Cameroon)
3. **Amount** is in XAF (Cameroon currency)
4. **payUrl** is what you redirect the customer to
5. **Webhook** automatically updates payment status - no frontend action needed
6. **Store transactionId** for payment verification
7. **Verify payment** when customer returns from CAMERPAY

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing required fields" | Ensure all fields (orderId, amount, phone, customerName, customerEmail) are provided |
| "Invalid phone number" | Phone must be 9+ digits, remove non-digit characters |
| "Order not found" | Verify orderId is correct MongoDB ID |
| "Payment not updating" | Check webhook configuration, ensure BACKEND_URL is correct |
| "Redirect not working" | Check payUrl is returned, ensure localStorage works |

