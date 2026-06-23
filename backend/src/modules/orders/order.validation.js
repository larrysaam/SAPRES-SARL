import Joi from 'joi';

/**
 * ✅ SECURE ORDER CREATION VALIDATION
 * 
 * Frontend ONLY sends:
 * - productId (required)
 * - quantity (required)
 * 
 * Backend NEVER accepts:
 * - unitPrice (fetched from product)
 * - totalPrice (calculated)
 * - subtotal (calculated)
 * - total (calculated)
 * 
 * This prevents price manipulation attacks
 */
const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required().messages({
        'string.empty': 'productId cannot be empty',
        'any.required': 'productId is required for each item',
      }),
      quantity: Joi.number().integer().min(1).required().messages({
        'number.min': 'Quantity must be at least 1',
        'any.required': 'quantity is required for each item',
      }),
    }).unknown(false) // Reject any other fields (like unitPrice, totalPrice)
  ).required().messages({
    'array.base': 'items must be an array',
    'any.required': 'items array is required',
  }),
  shippingAddress: Joi.object({
    fullName: Joi.string().max(100),
    phone: Joi.string().max(20),
    email: Joi.string().email(),
    address: Joi.string().max(200),
    city: Joi.string().max(50),
    region: Joi.string().max(50).allow('').optional(),
    postalCode: Joi.string().max(20).allow('').optional().default('0000'),
    country: Joi.string().max(50),
  }).optional(),
}).unknown(false); // Reject any unknown fields

const updateOrderSchema = Joi.object({
  status: Joi.string().valid(
    'PENDING_PAYMENT',
    'PAID',
    'PAYMENT_FAILED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
  ).optional(),
  'payment.status': Joi.string().valid(
    'PENDING_PAYMENT',
    'PAID',
    'PAYMENT_FAILED'
  ).optional(),
}).unknown(true);

export  {
  createOrderSchema,
  updateOrderSchema,
};
