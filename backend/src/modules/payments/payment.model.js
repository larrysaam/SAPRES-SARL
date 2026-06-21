import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  provider: { type: String, enum: ['cinetpay', 'mtn', 'orange', 'camerpay'], default: 'camerpay' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XAF' },
  transactionId: { type: String, unique: true, sparse: true }, // CAMERPAY transaction_uuid
  transactionReference: { type: String }, // CAMERPAY merchant_invoice_id
  providerReference: { type: String }, // Additional provider reference
  paymentMethod: { type: String, enum: ['mtn', 'orange', 'cinetpay', 'whatsapp'] }, // Actual payment method used
  status: { 
    type: String, 
    enum: ['pending', 'successful', 'failed', 'refunded', 'initiated', 'completed'], 
    default: 'pending' 
  },
  paymentUrl: { type: String }, // CAMERPAY pay_url
  customerPhone: { type: String }, // Phone number used for payment
  customerEmail: { type: String },
  customerName: { type: String },
  rawResponse: mongoose.Schema.Types.Mixed, // Store full API response for debugging
  metadata: mongoose.Schema.Types.Mixed, // Additional metadata
}, { timestamps: true });

// Index for faster lookups
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
