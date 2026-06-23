# Client Site Payment & Order Flow Guide

## Overview
This document explains how the product pages and other pages on the client (frontend) website work together to create successful orders and process payments through the CamerPay payment gateway.

---

## 1. Complete User Journey Flow

### Phase 1: Product Discovery & Selection

#### 1.1 Product Listing Page
**Purpose**: Display all available products with pricing and stock information

**What Happens**:
- User browses products with real-time prices fetched from backend
- Product cards show:
  - Product name and description
  - Original price and discount price (if applicable)
  - Available stock quantity
  - Product images
  - Quick "Add to Cart" button

**Frontend Logic**:
```
GET /api/v1/products (with pagination)
└─ Display products dynamically
   └─ Store product data in component state or context
      └─ Enable "Add to Cart" functionality
```

**Security Note**: ✅ All prices come from backend - frontend cannot modify them

---

#### 1.2 Product Detail Page
**Purpose**: Show complete product information before purchase

**What Happens**:
- User clicks on a product to see full details
- Page displays:
  - High-resolution images
  - Complete description
  - Price breakdown (original vs discount)
  - Current stock availability
  - Product specifications
  - Customer reviews (optional)
  - "Add to Cart" or "Buy Now" buttons
  - Quantity selector

**Frontend Logic**:
```
GET /api/v1/products/{productId}
└─ Display detailed product information
   └─ User selects quantity
      └─ Click "Add to Cart" or "Buy Now"
         └─ Store in cart state or cart context
```

**Cart Management**:
- Cart items stored in:
  - Browser localStorage (for persistence)
  - React Context (for state management)
  - Redux/Zustand (if implemented)

- Each cart item contains ONLY:
  - productId
  - quantity
  - ⚠️ NOT price (calculated by backend later)

---

### Phase 2: Cart Review & Checkout Initiation

#### 2.1 Shopping Cart Page
**Purpose**: Review items before proceeding to checkout

**What Happens**:
- User reviews all items in cart
- Page displays:
  - Product names and images
  - Quantities selected
  - Unit prices (fetched from backend)
  - Line item subtotals
  - Current stock status
  - Remove item buttons
  - Update quantity buttons
  - Proceed to Checkout button

**Important**:
- ⚠️ Do NOT store prices in cart items
- ✅ Always fetch current prices from API when displaying cart
- ✅ Validate stock availability before checkout

**Frontend Logic**:
```
Display Cart Items:
└─ For each item in cart:
   ├─ GET /api/v1/products/{productId}
   ├─ Fetch current price and stock
   ├─ Calculate line subtotal (qty × currentPrice)
   └─ Display to user

User Actions:
└─ Update quantity → Refresh cart total
└─ Remove item → Update cart state
└─ Proceed to checkout → Go to Phase 2.2
```

---

#### 2.2 Checkout Initiation
**Purpose**: Prepare order creation

**What Happens**:
- User clicks "Proceed to Checkout"
- System checks:
  - Cart is not empty
  - All items are in stock
  - User is authenticated OR willing to checkout as guest

**Frontend Logic**:
```
Validate Cart:
└─ Is cart empty? → Show error message
└─ Stock still available? → Verify via API
   ├─ YES → Proceed to shipping/billing form
   └─ NO → Show out-of-stock message, allow update

Next Step:
└─ Registered User → Go to Phase 2.3a
└─ Guest User → Go to Phase 2.3b
```

---

### Phase 3: Shipping & Billing Information

#### 3.1a Registered User Flow
**Purpose**: Collect/confirm shipping address for registered users

**What Happens**:
- User selects from saved addresses (if any)
- OR enters new shipping address
- Page displays form with fields:
  - Full Name (pre-filled from profile)
  - Phone Number (pre-filled from profile)
  - Email (pre-filled from profile)
  - Street Address
  - City
  - Postal Code
  - Country (default: Cameroon)

**Frontend Logic**:
```
On Page Load:
└─ GET /api/v1/auth/me (if authenticated)
   └─ Pre-fill user's name, phone, email
   └─ Show saved addresses (if any)

User Actions:
└─ Select saved address → Auto-fill form
└─ Enter new address → Validate fields
└─ Click "Review Order" → Go to Phase 3.2
```

---

#### 3.1b Guest User Flow
**Purpose**: Collect shipping information for guest checkout

**What Happens**:
- Guest sees checkout form with fields:
  - Full Name (REQUIRED)
  - Phone Number (REQUIRED)
  - Email Address (REQUIRED)
  - Street Address (optional)
  - City (optional)
  - Postal Code (optional)
  - Country (default: Cameroon)

**Validation**:
```
✅ Full Name: Not empty, min 3 characters
✅ Phone: Valid phone format (digits)
✅ Email: Valid email format (xxxx@xxxx.xxx)
✅ Address fields: Optional but if provided, must be valid
```

**Frontend Logic**:
```
On Page Load:
└─ Show empty form (no pre-fill for guests)

User Input Validation:
└─ Validate each field as user types (real-time)
└─ Show validation errors if invalid
└─ Disable "Review Order" button until all required fields valid

User Actions:
└─ Fill form with correct data
└─ Click "Review Order" → Go to Phase 3.2
```

---

### Phase 3.2: Order Review Page
**Purpose**: Final confirmation before creating order

**What Happens**:
- User reviews complete order summary:
  - All items with quantities and prices
  - Subtotal
  - Tax calculation (19.25% VAT for Cameroon)
  - Shipping cost
  - **Total Amount in XAF**
  - Shipping address confirmation
  - Contact information

**Important**: 
- ⚠️ ALL PRICES ARE CALCULATED BY BACKEND
- ✅ Frontend shows calculation but doesn't calculate it

**Frontend Logic**:
```
Display Order Summary:
├─ Items: GET from current cart state
├─ Prices: Fetch from /api/v1/products (fresh)
├─ Totals: Display as calculated by backend (not local math)
└─ Address: Show selected/entered shipping info

User Actions:
├─ Edit items → Return to cart
├─ Edit address → Return to shipping form
├─ Confirm order → Create order (Phase 4)
└─ Cancel → Return to cart
```

---

### Phase 4: Order Creation

#### 4.1 Create Order API Call
**Purpose**: Create order record in backend database

**Request**:
```javascript
POST /api/v1/orders

// For Registered Users:
{
  "items": [
    { "productId": "507f1f77bcf86cd799439011", "quantity": 2 },
    { "productId": "507f1f77bcf86cd799439012", "quantity": 1 }
  ]
  // shippingAddress is optional - uses user's saved address if not provided
}

// For Guest Users:
{
  "items": [
    { "productId": "507f1f77bcf86cd799439011", "quantity": 2 },
    { "productId": "507f1f77bcf86cd799439012", "quantity": 1 }
  ],
  "shippingAddress": {
    "fullName": "Jean Dupont",
    "phone": "699123456",
    "email": "jean@example.cm",
    "address": "123 Rue Main",
    "city": "Douala",
    "postalCode": "28000",
    "country": "Cameroon"
  }
}
```

**CRITICAL SECURITY**: 
- ⚠️ Frontend sends ONLY productId and quantity
- ⚠️ Frontend NEVER sends prices or totals
- ✅ Backend fetches current prices from database
- ✅ Backend calculates all amounts
- ✅ Backend validates stock availability

#### 4.2 Backend Order Processing
**What Backend Does**:
1. Validates order items structure
2. Fetches product information from database
3. Validates stock availability
4. Calculates unit prices (using current backend prices)
5. Calculates subtotal
6. Calculates tax (19.25%)
7. Calculates shipping cost (2,500 XAF or free if > 50,000 XAF)
8. Calculates final total
9. Creates order record with status: `PENDING_PAYMENT`
10. Returns order details to frontend

#### 4.3 Response from Backend
**Success Response**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "orderNumber": "ORD-1718958234567-439013",
    "items": [
      {
        "product": "507f1f77bcf86cd799439011",
        "productName": "Laptop",
        "quantity": 2,
        "unitPrice": 500000,
        "subtotal": 1000000
      }
    ],
    "subtotal": 1000000,
    "tax": 192500,
    "shippingCost": 2500,
    "totalAmount": 1195000,
    "status": "PENDING_PAYMENT",
    "customerName": "Jean Dupont",
    "customerEmail": "jean@example.cm",
    "customerPhone": "699123456"
  }
}
```

#### 4.4 Frontend After Order Creation
**What Happens**:
- Order created successfully
- Clear shopping cart
- Store order data in component state
- Navigate to Payment Initiation page
- Display order summary with payment button

---

### Phase 5: Payment Initiation

#### 5.1 Payment Page
**Purpose**: Initiate payment through CamerPay

**Page Displays**:
- Order number
- Total amount to pay (in XAF)
- Payment method selection:
  - MTN Money (mtn_money)
  - Orange Money (orange_money)
- Customer contact info
- "Pay Now" button

**Frontend Logic**:
```
On Page Load:
└─ Display order summary
└─ Show payment method options

User Actions:
├─ Select payment method
└─ Click "Pay Now" button
   └─ Call Payment Initiation API
```

#### 5.2 Initiate Payment API Call
**Request**:
```javascript
POST /api/v1/payments/camerpay/initiate

{
  "orderId": "507f1f77bcf86cd799439013",
  "paymentMethod": "mtn_money"  // or "orange_money"
}

// No authentication required - works for both users and guests
```

**CRITICAL**: 
- ✅ No user authentication required
- ✅ Works for both registered users and guests
- ✅ Uses order ID to fetch amount and details

#### 5.3 Backend Payment Processing
**What Backend Does**:
1. Validates order exists and is in PENDING_PAYMENT status
2. Fetches order amount from order record
3. Creates payment record in database
4. Calls CamerPay API with payment details
5. Stores CamerPay transaction UUID
6. Returns payment URL to frontend

#### 5.4 Response from Backend
**Success Response**:
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://pay.camerpay.com/... unique URL",
    "transactionReference": "PAY-1718958345678-439013",
    "orderId": "507f1f77bcf86cd799439013",
    "orderNumber": "ORD-1718958234567-439013",
    "amount": 1195000,
    "currency": "XAF"
  }
}
```

---

### Phase 6: CamerPay Payment Gateway

#### 6.1 Redirect to CamerPay
**What Happens**:
- User clicks "Pay Now" or is redirected
- Browser opens CamerPay payment URL
- User sees CamerPay payment form

**CamerPay Form Shows**:
- Customer name
- Customer phone
- Payment amount
- Payment method selected
- "Confirm Payment" button

#### 6.2 User Completes Payment
**What User Does**:
1. Enters phone number (if not pre-filled)
2. Confirms payment method
3. Clicks "Confirm Payment"
4. Receives SMS code
5. Enters SMS code to confirm
6. Payment processed

**Possible Outcomes**:
- ✅ Payment successful
- ❌ Payment failed (insufficient balance)
- ⏳ Payment pending (waiting for confirmation)
- ❌ Payment cancelled (user cancelled)

#### 6.3 CamerPay Redirects Back
**After Payment**:
- CamerPay sends webhook to backend immediately
- CamerPay redirects user back to frontend

---

### Phase 7: Payment Confirmation & Webhook Processing

#### 7.1 Webhook Callback (Backend)
**What Happens**:
- CamerPay sends webhook to backend
- Backend verifies webhook signature
- Backend updates payment status
- Backend updates order status based on payment result

**Webhook Data**:
```json
{
  "transaction_uuid": "txn-xyz...",
  "status": "completed",  // or "failed", "cancelled"
  "merchant_invoice_id": "ORD-1718958234567-439013",
  "amount": 1195000
}
```

**Backend Actions**:
```
If status === "completed" or "confirmed":
├─ Set payment status: SUCCESS
├─ Set order status: PAID
├─ Reduce product stock by quantities ordered
├─ Send confirmation email to customer
└─ Mark order as ready for processing

If status === "failed" or "cancelled":
├─ Set payment status: FAILED
├─ Set order status: PAYMENT_FAILED
├─ Keep stock unchanged (allow retry)
└─ Send failure notification to customer
```

#### 7.2 Frontend Handling
**What Happens**:
- User redirected back to frontend payment confirmation page
- Frontend checks payment status via API
- Displays appropriate message

**API Call**:
```javascript
GET /api/v1/payments/camerpay/verify/:transactionReference

// No authentication required - anyone can verify
// Use the transaction reference from payment initiation
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "SUCCESS",  // or "FAILED", "PENDING"
    "transactionUuid": "txn-xyz...",
    "orderNumber": "ORD-1718958234567-439013",
    "amount": 1195000,
    "paidAt": "2024-06-21T10:30:45.000Z"
  }
}
```

---

### Phase 8: Order Completion & Confirmation

#### 8.1 Payment Success Page
**If Payment Successful**:
- Display order confirmation
- Show order number
- Show order summary
- Show payment confirmation
- Show estimated delivery date
- Buttons:
  - "Download Invoice"
  - "Track Order"
  - "Continue Shopping"
  - "View My Orders"

**What Happens Behind Scenes**:
- Order status changed to: `PAID`
- Product stock reduced in inventory
- Confirmation email sent to customer
- Order moved to "Processing" queue
- Warehouse staff notified

#### 8.2 Payment Failure Page
**If Payment Failed**:
- Display error message
- Explain why payment failed
- Show order number (for reference)
- Show amount to pay
- Buttons:
  - "Retry Payment" (same order)
  - "Modify Order" (change items)
  - "Continue Shopping"

**Important**:
- Order remains in `PENDING_PAYMENT` status
- Stock is NOT reduced (keeps available)
- Customer can retry payment anytime
- Order expires after 24-48 hours if not paid

---

## 2. User Types & Their Flows

### 2.1 Registered User Flow
```
Login → Browse Products → Add to Cart → Checkout
├─ System auto-fills: Name, Phone, Email
├─ User confirms or changes address
├─ Create Order
├─ Initiate Payment (no re-auth needed)
├─ Complete CamerPay Payment
└─ View Confirmation
```

**Advantages**:
- ✅ Faster checkout (pre-filled info)
- ✅ Can save multiple addresses
- ✅ Order history available
- ✅ Loyalty program benefits (if implemented)
- ✅ Can update payment methods

---

### 2.2 Guest User Flow
```
Browse Products → Add to Cart → Checkout
├─ Enter: Name, Phone, Email, Address
├─ Validate all required fields
├─ Create Order (no auth required)
├─ Initiate Payment (no auth required)
├─ Complete CamerPay Payment
└─ View Confirmation (link sent to email)
```

**Advantages**:
- ✅ No registration required
- ✅ Quick checkout
- ✅ Can still make purchases
- ✅ Receives confirmation email

**Limitations**:
- ❌ Cannot save addresses
- ❌ No order history (unless they create account later)
- ❌ May need to enter info again for next purchase

---

## 3. Key Technical Points

### 3.1 Authentication NOT Required For
- ✅ Browsing products
- ✅ Viewing product details
- ✅ Adding to cart
- ✅ Creating orders
- ✅ Initiating payments
- ✅ Verifying payment status

### 3.2 Authentication Required For
- ✅ User profile/account
- ✅ Order history
- ✅ Saved addresses
- ✅ Payment methods
- ✅ Admin functions

### 3.3 Data Flow Security

**Frontend NEVER Sends**:
- ⚠️ Product prices
- ⚠️ Order totals
- ⚠️ Tax calculations
- ⚠️ Shipping amounts
- ⚠️ User passwords

**Frontend ALWAYS Sends**:
- ✅ Product IDs
- ✅ Quantities
- ✅ Customer contact info
- ✅ Shipping address

**Backend ALWAYS Calculates**:
- ✅ Current product prices
- ✅ Order subtotal
- ✅ Tax amount
- ✅ Shipping cost
- ✅ Final total

---

## 4. Error Handling at Each Stage

### 4.1 Cart Issues
```
❌ Empty Cart
├─ Message: "Your cart is empty"
├─ Action: Show continue shopping button
└─ Navigation: Return to products page

❌ Out of Stock
├─ Message: "Product X is out of stock"
├─ Action: Remove from cart or reduce quantity
└─ Navigation: Show available quantity options

❌ Price Changed
├─ Message: "Product price has changed"
├─ Action: Confirm new price before checkout
└─ Navigation: Show new price in cart
```

### 4.2 Order Creation Issues
```
❌ Invalid Shipping Address (Guest)
├─ Message: "Please provide full name, phone, and email"
├─ Action: Highlight empty required fields
└─ Navigation: Return to address form

❌ Stock No Longer Available
├─ Message: "Only X units available"
├─ Action: Allow customer to reduce quantity
└─ Navigation: Return to cart for adjustment

❌ Order Creation Failed
├─ Message: "Order creation failed. Please try again"
├─ Action: Show retry button
└─ Navigation: Return to order summary
```

### 4.3 Payment Issues
```
❌ Invalid Order
├─ Message: "Order not found or invalid"
├─ Action: Return to shopping
└─ Navigation: Return to products page

❌ Insufficient Balance
├─ Message: "Payment failed - insufficient balance"
├─ Action: Show retry button
└─ Navigation: Return to payment method selection

❌ Timeout
├─ Message: "Payment processing took too long"
├─ Action: Check payment status
└─ Navigation: Show status check link

❌ CamerPay Unavailable
├─ Message: "Payment gateway temporarily unavailable"
├─ Action: Show retry button
└─ Navigation: Keep order, try again later
```

---

## 5. Email Communications

### 5.1 Order Confirmation Email (After Order Created)
**Sent To**: Customer email

**Contains**:
- Order number
- Order summary
- Total amount
- Payment link (if not paid yet)
- Expected delivery date

### 5.2 Payment Confirmation Email (After Payment Success)
**Sent To**: Customer email

**Contains**:
- Payment confirmation
- Transaction reference
- Amount paid
- Payment method used
- Order number
- Estimated processing time

### 5.3 Payment Failure Email (After Payment Failed)
**Sent To**: Customer email

**Contains**:
- Payment failure notification
- Reason for failure
- Amount to pay
- Link to retry payment
- Contact support link

### 5.4 Shipping Notification (After Order Ships)
**Sent To**: Customer email

**Contains**:
- Shipping confirmation
- Tracking number
- Expected delivery date
- Shipping address

---

## 6. Best Practices for Frontend Implementation

### 6.1 Cart Management
```javascript
// CORRECT ✅
const addToCart = (productId, quantity) => {
  cart.push({ productId, quantity });
  // DO NOT store price here
}

// WRONG ❌
const addToCart = (productId, quantity, price) => {
  cart.push({ productId, quantity, price });
  // Never trust frontend price
}
```

### 6.2 Displaying Prices
```javascript
// CORRECT ✅
const displayPrice = async (productId) => {
  const product = await fetch(`/api/v1/products/${productId}`);
  return product.price; // Current price from backend
}

// WRONG ❌
const displayPrice = (cartItem) => {
  return cartItem.price; // Stale/untrusted price
}
```

### 6.3 Calculating Totals
```javascript
// CORRECT ✅
const getOrderTotals = (orderResponse) => {
  // Use totals from backend response
  return {
    subtotal: orderResponse.subtotal,
    tax: orderResponse.tax,
    shipping: orderResponse.shippingCost,
    total: orderResponse.totalAmount
  }
}

// WRONG ❌
const getOrderTotals = (items) => {
  // Never calculate totals locally
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  // This can be manipulated by user
}
```

### 6.4 Payment Flow
```javascript
// CORRECT ✅
const initiatePayment = async (orderId, paymentMethod) => {
  // Uses order ID - amount comes from backend
  const response = await POST('/payments/camerpay/initiate', {
    orderId,
    paymentMethod
  });
  
  window.location.href = response.paymentUrl;
}

// WRONG ❌
const initiatePayment = async (orderId, amount, paymentMethod) => {
  // Never send amount from frontend
  const response = await POST('/payments/camerpay/initiate', {
    orderId,
    amount, // Backend gets amount from order
    paymentMethod
  });
}
```

---

## 7. Testing the Complete Flow

### 7.1 Test Scenarios

#### Scenario 1: Registered User - Successful Payment
```
1. Login as registered user
2. Browse products
3. Add 2 items to cart
4. Go to checkout
5. Address auto-filled
6. Review order
7. Initiate payment
8. Complete CamerPay payment (test mode)
9. See success confirmation
10. Check order in order history
Expected: ✅ Order marked as PAID, stock reduced
```

#### Scenario 2: Guest User - Successful Payment
```
1. Do NOT login
2. Browse products
3. Add 3 items to cart
4. Go to checkout
5. Enter shipping details (required)
6. Review order
7. Initiate payment
8. Complete CamerPay payment (test mode)
9. See success confirmation
10. Check email for confirmation
Expected: ✅ Order created without user account, payment processed
```

#### Scenario 3: Failed Payment - Retry
```
1. Create order
2. Initiate payment
3. Fail payment in CamerPay (test mode)
4. See failure message
5. Click "Retry Payment"
6. Complete payment successfully
7. See success message
Expected: ✅ Same order, payment now marked as PAID
```

#### Scenario 4: Out of Stock Handling
```
1. Add item to cart
2. Reduce stock in admin
3. Try to checkout
4. Get out of stock error
5. Reduce quantity in cart
6. Proceed with reduced quantity
Expected: ✅ Checkout succeeds with available quantity
```

#### Scenario 5: Guest User Missing Info
```
1. Do NOT login
2. Add items to cart
3. Go to checkout
4. Leave email field empty
5. Try to proceed
6. See validation error on email
7. Enter email
8. Proceed successfully
Expected: ✅ Validation prevents checkout with missing required fields
```

---

## 8. Troubleshooting Guide

### Issue: Payment URL not working
**Possible Causes**:
- Order not in PENDING_PAYMENT status
- Order expired
- CamerPay API unavailable
- Invalid payment method

**Solution**:
- Verify order exists: GET /api/v1/orders/{orderId}
- Check order status
- Try different payment method
- Contact support if CamerPay issue

### Issue: Stock mismatch between cart and order
**Possible Causes**:
- Another customer purchased items while you were shopping
- Stock updated in admin

**Solution**:
- System validates stock at order creation
- If insufficient, returns error with available quantity
- User can reduce quantity and retry

### Issue: Payment succeeded but order not updated
**Possible Causes**:
- Webhook not received by backend
- Webhook processing delayed
- Network issue during webhook

**Solution**:
- Wait 5-10 minutes (webhooks can be delayed)
- Verify payment status: GET /api/v1/payments/verify/{ref}
- Check email for confirmation
- Contact support with transaction reference

### Issue: Can't create account after guest checkout
**Solution**:
- Guest checkout doesn't create account
- User can create account separately
- New account won't have order history from guest purchase
- Can request account linking support from admin

---

## 9. Summary

The complete payment and order flow is designed to:

✅ **Be Secure**:
- All prices calculated by backend
- Frontend cannot manipulate amounts
- Webhook verification prevents fraud
- Stock reserved during payment

✅ **Be Fast**:
- No authentication required for guests
- Real-time inventory checking
- Quick payment redirect to CamerPay
- Automatic webhook processing

✅ **Be User-Friendly**:
- Clear error messages
- Auto-fill for registered users
- Order tracking available
- Email confirmations for all actions

✅ **Be Flexible**:
- Works for registered users and guests
- Multiple payment methods
- Easy payment retry on failure
- Order can be modified before payment

The system ensures that every step from product selection to payment confirmation is validated and secure, protecting both the business and customers.
