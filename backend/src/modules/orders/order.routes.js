import e, { Router } from 'express';

import OrderController from './order.controller.js';
import {createOrderSchema, updateOrderSchema } from './order.validation.js';

const router = Router();

router
  .route('/')
  .post(OrderController.validate(createOrderSchema), OrderController.createOrder)
  .get(OrderController.getAllOrders);

router
  .route('/:id')
  .get(OrderController.getOrderById)
  .patch(OrderController.validate(updateOrderSchema), OrderController.updateOrder)
  .delete(OrderController.deleteOrder);

export default router;