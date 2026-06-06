import mongoose from 'mongoose';
import generateOrderNumber from '../../utils/generateOrderNumber.js';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },

    productName: String,

    quantity: Number,

    unitPrice: Number,

    totalPrice: Number
  },
  {
    _id: false
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true
    },

    customerName: {
      type: String,
      required: true
    },

    customerPhone: {
      type: String,
      required: true
    },

    customerEmail: String,

    deliveryAddress: String,

    items: [orderItemSchema],

    subtotal: Number,

    deliveryFee: Number,

    total: Number,

    paymentMethod: {
      type: String,
      enum: ["mtn", "orange"]
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded"
      ],
      default: "pending"
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "delivered",
        "cancelled"
      ],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose;
