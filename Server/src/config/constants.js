module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    BUSINESS_ADMIN: 'business_admin',
    STAFF: 'staff',
    CLIENT: 'client'
  },
  
  APPOINTMENT_STATUS: {
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
    RESCHEDULED: 'rescheduled'
  },
  
  INVOICE_STATUS: {
    DRAFT: 'draft',
    SENT: 'sent',
    PAID: 'paid',
    PARTIAL: 'partial',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled'
  },
  
  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    PAYPAL: 'paypal',
    BANK_TRANSFER: 'bank_transfer',
    CHECK: 'check'
  },
  
  PERMISSIONS: {
    APPOINTMENTS: {
      READ: 'appointments:read',
      WRITE: 'appointments:write',
      DELETE: 'appointments:delete'
    },
    CLIENTS: {
      READ: 'clients:read',
      WRITE: 'clients:write',
      DELETE: 'clients:delete'
    },
    BILLING: {
      READ: 'billing:read',
      WRITE: 'billing:write'
    },
    REPORTS: {
      READ: 'reports:read'
    },
    STAFF: {
      READ: 'staff:read',
      WRITE: 'staff:write',
      DELETE: 'staff:delete'
    }
  }
};