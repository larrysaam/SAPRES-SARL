import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import OrderController from './order.controller.js';
import orderValidation from './order.validation.js';

const router = Router();

router
  .route('/')
  .post(validate(orderValidation.createOrderSchema), OrderController.createOrder)
  .get(OrderController.getAllOrders);

router
  .route('/:id')
  .get(OrderController.getOrderById)
  .patch(validate(orderValidation.updateOrderSchema), OrderController.updateOrder)
  .delete(OrderController.deleteOrder);

export default router;