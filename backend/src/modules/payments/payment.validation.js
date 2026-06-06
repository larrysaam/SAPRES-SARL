import Joi from 'joi';

const createPaymentSchema = Joi.object({
  order: Joi.string().required(),
  provider: Joi.string().valid('mtn', 'orange').required(),
  amount: Joi.number().required(),
});

const updatePaymentSchema = Joi.object({
  status: Joi.string().valid('pending', 'successful', 'failed', 'refunded').optional(),
  providerReference: Joi.string().optional(),
});

export default {
  createPaymentSchema,
  updatePaymentSchema,
};
