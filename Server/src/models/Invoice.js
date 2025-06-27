const mongoose = require('mongoose');
const { INVOICE_STATUS, PAYMENT_METHODS } = require('../config/constants');

const InvoiceSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  invoiceNumber: { type: String, unique: true, required: true },
  
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    taxable: { type: Boolean, default: true }
  }],
  
  totals: {
    subtotal: { type: Number, required: true },
    tax: {
      rate: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    discount: {
      description: String,
      amount: { type: Number, default: 0 },
      type: { type: String, enum: ['fixed', 'percentage'] }
    },
    tip: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  
  currency: { type: String, default: 'USD' },
  
  payment: {
    status: { type: String, enum: Object.values(INVOICE_STATUS), default: INVOICE_STATUS.DRAFT },
    method: { type: String, enum: Object.values(PAYMENT_METHODS) },
    paidAmount: { type: Number, default: 0 },
    paidAt: Date,
    dueDate: Date,
    
    // Payment processing
    stripePaymentIntentId: String,
    paypalOrderId: String,
    transactionId: String,
    
    // Payment history
    payments: [{
      amount: Number,
      method: String,
      paidAt: Date,
      transactionId: String,
      notes: String
    }]
  },
  
  dates: {
    issuedAt: { type: Date, default: Date.now },
    sentAt: Date,
    dueDate: Date,
    paidAt: Date
  },
  
  notes: String,
  terms: String,
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Auto-generate invoice number
InvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber && this.isNew) {
    const count = await this.constructor.countDocuments({ business: this.business });
    this.invoiceNumber = `INV-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Indexes
InvoiceSchema.index({ business: 1, invoiceNumber: 1 });
InvoiceSchema.index({ client: 1, 'payment.status': 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);