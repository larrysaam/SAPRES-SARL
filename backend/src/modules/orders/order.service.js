import Order from './order.model.js';
import Product from '../products/product.model.js';
import User from '../auth/auth.model.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * OrderService - Handles order creation and management
 * 
 * CRITICAL SECURITY PRINCIPLE:
 * ✅ All prices are calculated on the backend
 * ✅ Frontend NEVER sends prices or totals
 * ✅ Frontend ONLY sends: productId and quantity
 * ✅ Backend fetches product prices from MongoDB
 * ✅ Backend calculates all totals
 */
class OrderService {
  /**
   * Create a new order with secure backend price calculation
   * 
   * Supports both registered users and guest checkouts
   * 
   * FLOW:
   * 1. Accept only productId and quantity from frontend
   * 2. Fetch actual product prices from database
   * 3. Validate stock availability
   * 4. Calculate order totals securely
   * 5. Create order with product snapshots
   * 6. Return order with totalAmount (for payment)
   * 
   * @param {String|null} userId - User creating the order (optional for guests)
   * @param {Array} items - [{ productId, quantity }, ...]
   * @param {Object} shippingAddress - Shipping details (required for guests, optional for users)
   * @returns {Promise<Object>} Created order
   */
  async createOrder(userId = null, items, shippingAddress) {
    try {
      console.log('📋 Creating order for user:', userId || 'GUEST');

      // ✅ VALIDATION: Items structure
      if (!Array.isArray(items) || items.length === 0) {
        throw new ApiError('Order must contain at least one item', 400);
      }

      // ✅ VALIDATION: Reject if frontend tries to send prices
      for (const item of items) {
        if (item.price || item.unitPrice || item.totalPrice || item.subtotal) {
          throw new ApiError('❌ SECURITY: Frontend cannot specify product prices!', 400);
        }

        if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
          throw new ApiError('Each item must have productId and valid quantity (min 1)', 400);
        }
      }

      // ✅ FETCH USER DATA (if userId provided)
      let user = null;
      if (userId) {
        user = await User.findById(userId).select('firstName lastName email phone');
        if (!user) {
          throw new ApiError('User not found', 404);
        }
      }

      // ✅ VALIDATE SHIPPING ADDRESS FOR GUESTS
      if (!userId) {
        if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.email) {
          throw new ApiError('Guest checkout requires: fullName, phone, and email', 400);
        }
      }

      // ✅ FETCH PRODUCT DATA FROM DATABASE
      const productIds = items.map(item => item.productId);
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id name sku price discountPrice stock images');

      if (products.length !== productIds.length) {
        throw new ApiError('Some products not found or invalid', 400);
      }

      // Create product map for quick lookups
      const productMap = new Map(products.map(p => [p._id.toString(), p]));

      // ✅ CALCULATE TOTALS SECURELY ON BACKEND
      let subtotal = 0;
      const orderItems = [];
      const outOfStockItems = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        
        if (!product) {
          throw new ApiError(`Product ${item.productId} not found`, 400);
        }

        // ✅ STOCK CHECK
        if (product.stock < item.quantity) {
          outOfStockItems.push({
            productId: item.productId,
            name: product.name,
            requested: item.quantity,
            available: product.stock,
          });
        }

        if (outOfStockItems.length > 0) {
          throw new ApiError(
            `Insufficient stock: ${outOfStockItems.map(i => `${i.name} (${i.available} available)`).join(', ')}`,
            400
          );
        }

        // ✅ USE BACKEND PRICE (never trust frontend)
        const unitPrice = product.discountPrice || product.price;
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          image: product.images?.[0]?.secureUrl || null,
          unitPrice,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });
      }

      // ✅ CALCULATE ADDITIONAL CHARGES
      const tax = this._calculateTax(subtotal);
      const shippingCost = this._calculateShipping(subtotal);
      const totalAmount = subtotal + tax + shippingCost;

      console.log('💰 Order totals calculated:', {
        subtotal,
        tax,
        shippingCost,
        totalAmount,
      });

      // ✅ CREATE ORDER DOCUMENT
      const order = new Order({
        user: user?._id || null,
        items: orderItems,
        subtotal,
        tax,
        shippingCost,
        totalAmount,
        status: 'PENDING_PAYMENT', // ✅ CRITICAL: Order created before payment
        payment: {
          status: 'PENDING_PAYMENT',
        },
        shippingAddress: {
          fullName: shippingAddress.fullName || (user ? `${user.firstName} ${user.lastName}` : ''),
          phone: shippingAddress.phone || (user ? user.phone : ''),
          email: shippingAddress.email || (user ? user.email : ''),
          address: shippingAddress.address || '',
          city: shippingAddress.city || '',
          postalCode:  '0000',
          country: shippingAddress.country || 'Cameroon',
        },
        customerName: shippingAddress.fullName || (user ? `${user.firstName} ${user.lastName}` : ''),
        customerPhone: shippingAddress.phone || (user ? user.phone : ''),
        customerEmail: shippingAddress.email || (user ? user.email : ''),
      });

      const savedOrder = await order.save();

      console.log(`✅ Order created: ${savedOrder.orderNumber} | Total: ${totalAmount} XAF`);

      return {
        _id: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        items: savedOrder.items,
        subtotal: savedOrder.subtotal,
        tax: savedOrder.tax,
        shippingCost: savedOrder.shippingCost,
        totalAmount: savedOrder.totalAmount,
        status: savedOrder.status,
        customerName: savedOrder.customerName,
        customerEmail: savedOrder.customerEmail,
        customerPhone: savedOrder.customerPhone,
      };
    } catch (error) {
      console.error('❌ Order creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Calculate tax (19.25% VAT for Cameroon)
   * @private
   */
  _calculateTax(subtotal) {
    const TAX_RATE = 0.1925;
    return Math.round(subtotal * TAX_RATE * 100) / 100;
  }

  /**
   * Calculate shipping cost
   * @private
   */
 _calculateShipping(subtotal) {
    // Free shipping for orders over threshold
    const FREE_SHIPPING_THRESHOLD = parseInt(process.env.FREE_SHIPPING_THRESHOLD || '50000', 10);
    const STANDARD_SHIPPING_COST = parseInt(process.env.STANDARD_SHIPPING_COST || '2500', 10);
    
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return STANDARD_SHIPPING_COST;
  }

  /**
   * Get order by ID with populated references
   */
  async getById(id) {
    try {
      const order = await Order.findById(id)
        .populate('user', 'firstName lastName email phone')
        .populate('items.product', 'name sku price stock')
        .populate('payment.transactionId', 'transactionReference status amount paidAt');

      if (!order) {
        throw new ApiError('Order not found', 404);
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all orders with pagination
   */
  async getAll({ page = 1, limit = 20, status = null, userId = null } = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      if (status) query.status = status;
      if (userId) query.user = userId;

      const orders = await Order.find(query)
        .populate('user', 'firstName lastName email')
        .populate('items.product', 'name sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Order.countDocuments(query);

      return {
        data: orders,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId) {
    try {
      return await Order.find({ user: userId })
        .populate('items.product', 'name sku price')
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update order status (called by Payment Service)
   * 
   * ✅ CRITICAL: Only PaymentService should call this
   * ✅ Updates order status based on payment result
   */
  async updateOrderStatus(orderId, newStatus, paymentInfo = {}) {
    try {
      const validStatuses = [
        'PENDING_PAYMENT',
        'PAID',
        'PAYMENT_FAILED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED',
      ];

      if (!validStatuses.includes(newStatus)) {
        throw new ApiError(`Invalid status: ${newStatus}`, 400);
      }

      const updateData = { status: newStatus };

      // Update payment status and timeline
      if (newStatus === 'PAID') {
        updateData['payment.status'] = 'PAID';
        updateData.paidAt = new Date();
      } else if (newStatus === 'PAYMENT_FAILED') {
        updateData['payment.status'] = 'PAYMENT_FAILED';
      }

      const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true });

      if (!order) {
        throw new ApiError('Order not found', 404);
      }

      console.log(`✅ Order ${order.orderNumber} status updated to: ${newStatus}`);
      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reduce product stock after successful payment
   * 
   * ✅ CRITICAL: Called by Payment Service after payment confirmation
   * ✅ Prevents overselling
   */
  async reduceProductStock(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) throw new ApiError('Order not found', 404);

      for (const item of order.items) {
        // ✅ item.product is an ObjectId (not populated), so use it directly
        const updatedProduct = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (!updatedProduct) {
          throw new ApiError(`Product not found: ${item.productName}`, 404);
        }

        if (updatedProduct.stock < 0) {
          throw new ApiError(`Stock cannot be negative for product: ${item.productName}`, 400);
        }

        console.log(`✅ Stock reduced for ${item.productName}: -${item.quantity} (new stock: ${updatedProduct.stock})`);
      }

      console.log(`✅ All stock reduced for order ${order.orderNumber}`);
    } catch (error) {
      console.error('❌ Stock reduction failed:', error.message);
      throw error;
    }
  }

  /**
   * Update order with payment info
   */
  async updatePaymentInfo(orderId, paymentId, paymentMethod) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          'payment.transactionId': paymentId,
          'payment.method': paymentMethod,
        },
        { new: true }
      );

      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, reason = '') {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          notes: reason,
        },
        { new: true }
      );

      if (!order) throw new ApiError('Order not found', 404);

      console.log(`✅ Order ${order.orderNumber} cancelled`);
      return order;
    } catch (error) {
      throw error;
    }
  }
}

export default new OrderService();