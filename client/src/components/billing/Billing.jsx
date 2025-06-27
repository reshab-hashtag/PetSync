import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  CreditCardIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Billing = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    period: 'all',
  });

  useEffect(() => {
    // Mock data
    const mockInvoices = [
      {
        id: 'INV-001',
        clientName: 'John Doe',
        petName: 'Buddy',
        services: ['Grooming', 'Nail Trimming'],
        amount: 75.00,
        status: 'paid',
        dueDate: new Date(2025, 5, 30),
        paidDate: new Date(2025, 5, 25),
        createdDate: new Date(2025, 5, 20),
      },
      {
        id: 'INV-002',
        clientName: 'Jane Smith',
        petName: 'Whiskers',
        services: ['Veterinary Checkup', 'Vaccination'],
        amount: 120.00,
        status: 'pending',
        dueDate: new Date(2025, 6, 5),
        createdDate: new Date(2025, 5, 22),
      },
      {
        id: 'INV-003',
        clientName: 'Robert Johnson',
        petName: 'Max',
        services: ['Training Session'],
        amount: 60.00,
        status: 'overdue',
        dueDate: new Date(2025, 5, 15),
        createdDate: new Date(2025, 5, 10),
      },
      {
        id: 'INV-004',
        clientName: 'Sarah Wilson',
        petName: 'Luna',
        services: ['Grooming', 'Teeth Cleaning'],
        amount: 95.00,
        status: 'paid',
        dueDate: new Date(2025, 5, 28),
        paidDate: new Date(2025, 5, 26),
        createdDate: new Date(2025, 5, 18),
      },
    ];

    const mockPayments = [
      {
        id: 'PAY-001',
        invoiceId: 'INV-001',
        amount: 75.00,
        method: 'Credit Card',
        date: new Date(2025, 5, 25),
        status: 'completed',
      },
      {
        id: 'PAY-002',
        invoiceId: 'INV-004',
        amount: 95.00,
        method: 'Cash',
        date: new Date(2025, 5, 26),
        status: 'completed',
      },
    ];

    setTimeout(() => {
      setInvoices(mockInvoices);
      setPayments(mockPayments);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filters.search && !invoice.clientName.toLowerCase().includes(filters.search.toLowerCase()) &&
        !invoice.id.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && invoice.status !== filters.status) {
      return false;
    }
    return true;
  });

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-gray-600">Manage invoices, payments, and financial records</p>
        </div>
        {user?.role !== 'pet_owner' && (
          <button className="btn-primary flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Invoice
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <ClockIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">${pendingAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-red-100 text-red-600">
                <ExclamationCircleIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">${overdueAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="input-field pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
            </select>
            <select
              className="input-field"
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button className="btn-secondary flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
        </div>
        
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status !== 'all' 
                ? 'Try adjusting your search criteria.' 
                : 'Get started by creating your first invoice.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client & Pet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getStatusIcon(invoice.status)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                          <div className="text-sm text-gray-500">
                            {invoice.createdDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{invoice.clientName}</div>
                        <div className="text-sm text-gray-500">{invoice.petName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {invoice.services.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${invoice.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.dueDate.toLocaleDateString()}
                      </div>
                      {invoice.status === 'overdue' && (
                        <div className="text-xs text-red-600">
                          {Math.ceil((new Date() - invoice.dueDate) / (1000 * 60 * 60 * 24))} days overdue
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                        {invoice.status === 'pending' && (
                          <button className="text-yellow-600 hover:text-yellow-900">
                            <CreditCardIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
        </div>
        
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCardIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No recent payments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => {
              const relatedInvoice = invoices.find(inv => inv.id === payment.invoiceId);
              return (
                <div key={payment.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Payment for {payment.invoiceId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {relatedInvoice?.clientName} • {payment.method} • {payment.date.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">Completed</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;