import Joi from 'joi';

const createOrderSchema = Joi.object({
  customerName: Joi.string().required(),
  customerPhone: Joi.string().required(),
  customerEmail: Joi.string().email().optional(),
  deliveryAddress: Joi.string().optional(),
  items: Joi.array().items(
    Joi.object({
      product: Joi.string(),
      productName: Joi.string(),
      quantity: Joi.number().required(),
      unitPrice: Joi.number().required(),
      totalPrice: Joi.number().required(),
    })
  ).required(),
  subtotal: Joi.number().required(),
  deliveryFee: Joi.number().optional(),
  total: Joi.number().required(),
  paymentMethod: Joi.string().valid('mtn', 'orange').optional(),
});

const updateOrderSchema = Joi.object({
  orderStatus: Joi.string().valid('pending', 'processing', 'delivered', 'cancelled').optional(),
  paymentStatus: Joi.string().valid('pending', 'paid', 'failed', 'refunded').optional(),
});

export  {
  createOrderSchema,
  updateOrderSchema,
};
