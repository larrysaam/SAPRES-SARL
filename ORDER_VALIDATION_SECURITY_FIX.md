# Order Validation Security Fix

## Problem
The order validation schema was requiring the frontend to send:
- `unitPrice` (price per item)
- `totalPrice` (line item total)
- `subtotal` (order subtotal)
- `total` (order total)
- `deliveryFee`

This is a **CRITICAL SECURITY VULNERABILITY** because:
- ⚠️ Frontend can manipulate prices
- ⚠️ Customers could send lower amounts than the actual price
- ⚠️ Discounts could be applied fraudulently
- ⚠️ Shipping costs could be zeroed out

---

## Solution

### What Changed

#### Before (WRONG ❌)
```javascript
const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product: Joi.string(),
      productName: Joi.string(),
      quantity: Joi.number().required(),
      unitPrice: Joi.number().required(),      // ❌ SECURITY ISSUE
      totalPrice: Joi.number().required(),     // ❌ SECURITY ISSUE
    })
  ).required(),
  subtotal: Joi.number().required(),           // ❌ SECURITY ISSUE
  deliveryFee: Joi.number().optional(),        // ❌ SECURITY ISSUE
  total: Joi.number().required(),              // ❌ SECURITY ISSUE
  paymentMethod: Joi.string().valid('mtn', 'orange').optional(),
});
```

#### After (CORRECT ✅)
```javascript
const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),      // ✅ ONLY productId
      quantity: Joi.number().integer().min(1).required(), // ✅ ONLY quantity
    }).unknown(false) // Reject unitPrice, totalPrice, etc.
  ).required(),
  
  shippingAddress: Joi.object({
    fullName: Joi.string().max(100),
    phone: Joi.string().max(20),
    email: Joi.string().email(),
    address: Joi.string().max(200),
    city: Joi.string().max(50),
    postalCode: Joi.string().max(20),
    country: Joi.string().max(50),
  }).optional(),
}).unknown(false); // Reject unknown fields
```

---

## What This Means

### Frontend Should Send
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    },
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 1
    }
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

### Backend Calculates
```javascript
// For each item:
1. Fetch product from database using productId
2. Get current price from product
3. Calculate: unitPrice × quantity = lineSubtotal
4. Sum all lineSubtotals = subtotal
5. Calculate: subtotal × 19.25% = tax
6. Calculate: shippingCost (2500 or free)
7. Calculate: subtotal + tax + shippingCost = totalAmount
```

### Result
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "productName": "Laptop",
      "quantity": 2,
      "unitPrice": 500000,
      "subtotal": 1000000
    }
  ],
  "subtotal": 1000000,
  "tax": 192500,
  "shippingCost": 2500,
  "totalAmount": 1195000
}
```

---

## Error Message Change

### Before
```
Error: "items[0].unitPrice" is required
```

### After (if frontend sends unitPrice)
```
Error: "items[0]" contains an unknown key "unitPrice"
```

This rejects any attempt to send price information from the frontend.

---

## API Request Example

### CORRECT ✅ (Secure)
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "fullName": "Jean Dupont",
      "phone": "699123456",
      "email": "jean@example.cm"
    }
  }'
```

### WRONG ❌ (Will be rejected)
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "quantity": 2,
        "unitPrice": 500000,      # ❌ REJECTED
        "totalPrice": 1000000     # ❌ REJECTED
      }
    ],
    "subtotal": 1000000,          # ❌ REJECTED
    "total": 1195000              # ❌ REJECTED
  }'
```

Response:
```json
{
  "success": false,
  "errors": ["items[0] contains an unknown key \"unitPrice\""]
}
```

---

## Security Benefits

✅ **Price Integrity**: 
- Customers cannot manipulate prices
- Current prices always fetched from database

✅ **Discount Protection**: 
- Discounts controlled by backend
- Frontend cannot apply unauthorized discounts

✅ **Shipping Cost Protection**: 
- Shipping calculated by backend logic
- Cannot be zeroed out or reduced fraudulently

✅ **Tax Calculation**: 
- Tax always calculated correctly
- Cannot be evaded by frontend manipulation

✅ **Stock Validation**: 
- Stock checked by backend
- Cannot oversell due to frontend inconsistencies

---

## Frontend Implementation

### JavaScript/React Example

```javascript
// CORRECT ✅
async function createOrder(cartItems, shippingInfo) {
  const orderPayload = {
    items: cartItems.map(item => ({
      productId: item.productId,  // ✅ ONLY productId
      quantity: item.quantity      // ✅ ONLY quantity
    })),
    shippingAddress: {
      fullName: shippingInfo.fullName,
      phone: shippingInfo.phone,
      email: shippingInfo.email,
      address: shippingInfo.address,
      city: shippingInfo.city,
      postalCode: shippingInfo.postalCode,
      country: shippingInfo.country
    }
  };

  const response = await fetch('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });

  return response.json();
}

// WRONG ❌ (Don't do this)
async function createOrderWrong(cartItems, shippingInfo) {
  const orderPayload = {
    items: cartItems, // ❌ Includes unitPrice, totalPrice, etc.
    subtotal: calculateSubtotal(cartItems),  // ❌ Frontend calculation
    total: calculateTotal(cartItems),        // ❌ Frontend calculation
    shippingAddress: shippingInfo
  };

  const response = await fetch('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });

  return response.json();
}
```

---

## Files Modified

- ✅ `/backend/src/modules/orders/order.validation.js`

---

## Testing

### Test Case 1: Valid Request
```bash
POST /api/v1/orders

Request:
{
  "items": [
    {"productId": "507f...", "quantity": 2}
  ],
  "shippingAddress": {
    "fullName": "Test User",
    "phone": "699123456",
    "email": "test@example.com"
  }
}

Expected: ✅ Order created successfully
Status: 200
```

### Test Case 2: Missing productId
```bash
POST /api/v1/orders

Request:
{
  "items": [
    {"quantity": 2}
  ],
  "shippingAddress": {...}
}

Expected: ❌ Validation error
Status: 400
Error: "productId is required for each item"
```

### Test Case 3: Sending unitPrice (Security Test)
```bash
POST /api/v1/orders

Request:
{
  "items": [
    {
      "productId": "507f...",
      "quantity": 2,
      "unitPrice": 999  # Hacker tries to set low price
    }
  ],
  "shippingAddress": {...}
}

Expected: ❌ Request rejected
Status: 400
Error: "items[0] contains an unknown key \"unitPrice\""
```

### Test Case 4: Sending subtotal (Security Test)
```bash
POST /api/v1/orders

Request:
{
  "items": [...],
  "subtotal": 1,  # Hacker tries to set low total
  "shippingAddress": {...}
}

Expected: ❌ Request rejected
Status: 400
Error: "contains an unknown key \"subtotal\""
```

---

## Migration Notes

If you have existing frontend code that sends prices, it needs to be updated:

### Old Frontend Code (STOP USING)
```javascript
// DEPRECATED - Will not work anymore
fetch('/api/v1/orders', {
  method: 'POST',
  body: JSON.stringify({
    items: [
      {
        productId: "...",
        quantity: 2,
        unitPrice: 500000,  // REMOVE THIS
        totalPrice: 1000000 // REMOVE THIS
      }
    ],
    subtotal: 1000000,      // REMOVE THIS
    total: 1195000,         // REMOVE THIS
    shippingAddress: {...}
  })
})
```

### New Frontend Code (USE THIS)
```javascript
// NEW - Correct and secure
fetch('/api/v1/orders', {
  method: 'POST',
  body: JSON.stringify({
    items: [
      {
        productId: "...",
        quantity: 2
        // ✅ NO prices sent
      }
    ],
    shippingAddress: {...}
    // ✅ NO subtotal or total sent
  })
})
```

---

## Summary

This security fix ensures:
- ✅ Prices cannot be manipulated by frontend
- ✅ All calculations are backend-controlled
- ✅ Fraudulent orders are prevented
- ✅ Tax and shipping are always correct
- ✅ Stock is always accurate

The system now follows the principle: **"Trust nothing from the frontend; calculate everything on the backend."**
