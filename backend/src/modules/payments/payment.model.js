import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // ✅ CRITICAL: Link to Order - this is the relationship
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // 🔑 Payment Identifiers
  transactionReference: { 
    type: String, 
    unique: true, 
    sparse: true,
    index: true,
    required: true,
    // Format: PAY-{timestamp}-{orderId}
  },
  transactionUuid: { 
    type: String, 
    unique: true, 
    sparse: true,
    index: true,
    // CAMERPAY transaction_uuid
  },
  merchantInvoiceId: { 
    type: String, 
    // Order number for CAMERPAY
  },

  // 💰 Amount Information
  amount: { 
    type: Number, 
    required: true,
    min: 0,
  },
  currency: { 
    type: String, 
    enum: ['XAF', 'USD', 'EUR'],
    default: 'XAF',
  },

  // 🏢 Provider Information
  provider: { 
    type: String, 
    enum: ['camerpay', 'cinetpay'], 
    default: 'camerpay',
  },
  paymentMethod: { 
    type: String, 
    enum: ['mtn_money', 'orange_money', 'credit_card', 'bank_transfer'],
  },

  // 📊 Payment Status
  status: { 
    type: String, 
    enum: [
      'INITIATED',      // Payment created, not yet sent to CAMERPAY
      'PENDING',        // Sent to CAMERPAY, waiting for customer
      'SUCCESS',        // Payment confirmed by CAMERPAY
      'FAILED',         // Payment failed or cancelled
      'CANCELLED',      // Customer cancelled
      'REFUNDED',       // Money returned to customer
    ], 
    default: 'INITIATED',
    index: true,
  },

  // 🔗 Payment URL and Customer Data
  paymentUrl: { 
    type: String,
    // CAMERPAY pay_url - redirect customer here
  },
  customerPhone: { 
    type: String,
    required: true,
  },
  customerEmail: { 
    type: String,
    required: true,
  },
  customerName: { 
    type: String,
  },

  // ⏰ Webhook Tracking - CRITICAL for preventing duplicates
  webhookReceived: {
    type: Boolean,
    default: false,
    index: true,
  },
  webhookData: mongoose.Schema.Types.Mixed,
  webhookReceivedAt: Date,
  webhookSignatureValid: Boolean,

  // 📅 Timeline
  initiatedAt: {
    type: Date,
    default: Date.now,
  },
  paidAt: Date,
  failedAt: Date,
  refundedAt: Date,

  // 📝 Metadata and Debugging
  rawResponse: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,

}, { timestamps: true });

// ⚡ Indexes for performance
paymentSchema.index({ transactionUuid: 1, webhookReceived: 1 }); // Prevent duplicate webhook processing
paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ transactionReference: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
