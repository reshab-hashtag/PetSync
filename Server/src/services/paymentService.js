const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const Invoice = require('../models/Invoice');
const { sendEmail } = require('./emailService');

class PaymentService {
  constructor() {
    // PayPal configuration
    this.paypalClient = new paypal.core.PayPalHttpClient(
      process.env.NODE_ENV === 'production'
        ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
        : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    );
  }

  // Create Stripe payment intent
  async createStripePayment(invoiceId, returnUrl) {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('client', 'profile')
        .populate('business', 'profile');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(invoice.totals.total * 100), // Convert to cents
        currency: invoice.currency.toLowerCase(),
        customer_email: invoice.client.profile.email,
        metadata: {
          invoiceId: invoice._id.toString(),
          businessId: invoice.business._id.toString(),
          clientId: invoice.client._id.toString()
        },
        receipt_email: invoice.client.profile.email,
        description: `Payment for invoice ${invoice.invoiceNumber}`
      });

      // Update invoice with payment intent ID
      invoice.payment.stripePaymentIntentId = paymentIntent.id;
      await invoice.save();

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      throw new Error(`Stripe payment creation failed: ${error.message}`);
    }
  }

  // Create PayPal order
  async createPayPalPayment(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('client', 'profile')
        .populate('business', 'profile');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: invoice.currency,
            value: invoice.totals.total.toFixed(2)
          },
          description: `Payment for invoice ${invoice.invoiceNumber}`,
          reference_id: invoice._id.toString()
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          brand_name: 'PetSync',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW'
        }
      });

      const order = await this.paypalClient.execute(request);

      // Update invoice with PayPal order ID
      invoice.payment.paypalOrderId = order.result.id;
      await invoice.save();

      return {
        orderId: order.result.id,
        approvalUrl: order.result.links.find(link => link.rel === 'approve').href
      };
    } catch (error) {
      throw new Error(`PayPal payment creation failed: ${error.message}`);
    }
  }

  // Process successful payment
  async processPayment(invoiceId, paymentData) {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('client', 'profile')
        .populate('business', 'profile');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Update payment information
      invoice.payment.status = 'paid';
      invoice.payment.method = paymentData.method;
      invoice.payment.paidAmount = paymentData.amount;
      invoice.payment.paidAt = new Date();
      invoice.payment.transactionId = paymentData.transactionId;

      // Add to payment history
      invoice.payment.payments.push({
        amount: paymentData.amount,
        method: paymentData.method,
        paidAt: new Date(),
        transactionId: paymentData.transactionId
      });

      await invoice.save();

      // Send payment confirmation email
      await sendEmail({
        to: invoice.client.profile.email,
        subject: 'Payment Confirmation - PetSync',
        template: 'payment-confirmation',
        data: {
          clientName: invoice.client.fullName,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totals.total,
          currency: invoice.currency,
          transactionId: paymentData.transactionId,
          businessName: invoice.business.profile.name
        }
      });

      return invoice;
    } catch (error) {
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  // Handle Stripe webhook
  async handleStripeWebhook(signature, payload) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const invoiceId = paymentIntent.metadata.invoiceId;
          
          await this.processPayment(invoiceId, {
            method: 'card',
            amount: paymentIntent.amount / 100,
            transactionId: paymentIntent.id
          });
          break;

        case 'payment_intent.payment_failed':
          // Handle failed payment
          console.log('Payment failed:', event.data.object);
          break;
      }

      return { received: true };
    } catch (error) {
      throw new Error(`Webhook handling failed: ${error.message}`);
    }
  }

  // Process refund
  async processRefund(invoiceId, amount, reason) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      let refund;
      if (invoice.payment.stripePaymentIntentId) {
        // Stripe refund
        refund = await stripe.refunds.create({
          payment_intent: invoice.payment.stripePaymentIntentId,
          amount: Math.round(amount * 100),
          reason: 'requested_by_customer',
          metadata: {
            invoiceId: invoice._id.toString(),
            reason
          }
        });
      } else if (invoice.payment.paypalOrderId) {
        // PayPal refund (implementation needed)
        // This would require capturing the original payment first
        throw new Error('PayPal refunds not implemented yet');
      }

      // Update invoice
      invoice.payment.status = 'partial';
      invoice.payment.paidAmount -= amount;

      await invoice.save();

      return refund;
    } catch (error) {
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();