import React, { useState, useEffect } from 'react';
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const BusinessPaymentsSAdmin = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Mock data - replace with API calls
  const mockBusinesses = [
    {
      id: '1',
      businessName: 'PetCare Plus',
      ownerName: 'John Smith',
      email: 'john@petcareplus.com',
      phone: '+1 (555) 123-4567',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      currentPeriodStart: '2024-01-01',
      currentPeriodEnd: '2024-01-31',
      nextBillingDate: '2024-02-01',
      monthlyAmount: 1999,
      currency: 'INR',
      paymentStatus: 'paid',
      lastPaymentDate: '2024-01-01',
      totalRevenue: 23988,
      outstandingAmount: 0,
      address: 'Mumbai, Maharashtra',
      businessCategory: 'Veterinary Clinic'
    },
    {
      id: '2',
      businessName: 'Happy Tails Grooming',
      ownerName: 'Sarah Johnson',
      email: 'sarah@happytails.com',
      phone: '+1 (555) 987-6543',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      currentPeriodStart: '2024-01-15',
      currentPeriodEnd: '2024-02-15',
      nextBillingDate: '2024-02-15',
      monthlyAmount: 999,
      currency: 'INR',
      paymentStatus: 'overdue',
      lastPaymentDate: '2023-12-15',
      totalRevenue: 11988,
      outstandingAmount: 1999,
      address: 'Delhi, India',
      businessCategory: 'Pet Grooming'
    },
    {
      id: '3',
      businessName: 'Furry Friends Daycare',
      ownerName: 'Mike Wilson',
      email: 'mike@furryfriends.com',
      phone: '+1 (555) 456-7890',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'trial',
      currentPeriodStart: '2024-01-20',
      currentPeriodEnd: '2024-02-20',
      nextBillingDate: '2024-02-20',
      monthlyAmount: 1999,
      currency: 'INR',
      paymentStatus: 'pending',
      lastPaymentDate: null,
      totalRevenue: 0,
      outstandingAmount: 0,
      address: 'Bangalore, Karnataka',
      businessCategory: 'Pet Daycare'
    }
  ];

  const mockPayments = [
    {
      id: 'pay_1',
      businessId: '1',
      businessName: 'PetCare Plus',
      invoiceNumber: 'INV-2024-001',
      amount: 1999,
      currency: 'INR',
      status: 'paid',
      paymentDate: '2024-01-01',
      dueDate: '2024-01-01',
      paymentMethod: 'card',
      transactionId: 'txn_123456789',
      billingPeriod: 'Jan 2024',
      plan: 'Premium'
    },
    {
      id: 'pay_2',
      businessId: '2',
      businessName: 'Happy Tails Grooming',
      invoiceNumber: 'INV-2024-002',
      amount: 999,
      currency: 'INR',
      status: 'overdue',
      paymentDate: null,
      dueDate: '2024-01-15',
      paymentMethod: null,
      transactionId: null,
      billingPeriod: 'Jan 2024',
      plan: 'Basic'
    },
    {
      id: 'pay_3',
      businessId: '1',
      businessName: 'PetCare Plus',
      invoiceNumber: 'INV-2023-012',
      amount: 1999,
      currency: 'INR',
      status: 'paid',
      paymentDate: '2023-12-01',
      dueDate: '2023-12-01',
      paymentMethod: 'bank_transfer',
      transactionId: 'txn_987654321',
      billingPeriod: 'Dec 2023',
      plan: 'Premium'
    }
  ];

  useEffect(() => {
    loadBusinesses();
    loadPayments();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      setTimeout(() => {
        setBusinesses(mockBusinesses);
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error('Failed to load businesses');
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      // Replace with actual API call
      setPayments(mockPayments);
    } catch (error) {
      toast.error('Failed to load payments');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'trial':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPlanBadge = (plan) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-medium rounded-full";
    switch (plan.toLowerCase()) {
      case 'premium':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'basic':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'free':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadInvoice = async (paymentId) => {
    try {
      setLoading(true);
      // Replace with actual API call
      toast.success('Invoice downloaded successfully');
      setLoading(false);
    } catch (error) {
      toast.error('Failed to download invoice');
      setLoading(false);
    }
  };

  const sendPaymentReminder = async (businessId) => {
    try {
      setLoading(true);
      // Replace with actual API call
      toast.success('Payment reminder sent successfully');
      setLoading(false);
    } catch (error) {
      toast.error('Failed to send payment reminder');
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || business.paymentStatus === statusFilter;
    const matchesPlan = planFilter === 'all' || business.subscriptionPlan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const calculateStats = () => {
    const totalBusinesses = businesses.length;
    const activeSubscriptions = businesses.filter(b => b.subscriptionStatus === 'active').length;
    const overduePayments = businesses.filter(b => b.paymentStatus === 'overdue').length;
    const totalRevenue = businesses.reduce((sum, b) => sum + b.totalRevenue, 0);
    const outstandingAmount = businesses.reduce((sum, b) => sum + b.outstandingAmount, 0);
    
    return {
      totalBusinesses,
      activeSubscriptions,
      overduePayments,
      totalRevenue,
      outstandingAmount
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Payments</h1>
          <p className="text-gray-600">Manage subscriptions and billing for all businesses</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Manual Payment
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <BuildingOfficeIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Businesses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBusinesses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 text-red-600">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overduePayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <BanknotesIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.outstandingAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search businesses..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Businesses ({filteredBusinesses.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {business.businessName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {business.businessCategory}
                        </div>
                        <div className="text-sm text-gray-500">
                          {business.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {business.ownerName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          {business.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {business.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={getPlanBadge(business.subscriptionPlan)}>
                          {business.subscriptionPlan}
                        </span>
                        <div className="text-sm text-gray-900">
                          {formatCurrency(business.monthlyAmount)}/month
                        </div>
                        <span className={getStatusBadge(business.subscriptionStatus)}>
                          {business.subscriptionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(business.paymentStatus)}
                        <span className={getStatusBadge(business.paymentStatus)}>
                          {business.paymentStatus}
                        </span>
                      </div>
                      {business.outstandingAmount > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          Outstanding: {formatCurrency(business.outstandingAmount)}
                        </div>
                      )}
                      {business.lastPaymentDate && (
                        <div className="text-sm text-gray-500 mt-1">
                          Last: {formatDate(business.lastPaymentDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(business.nextBillingDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Period: {formatDate(business.currentPeriodStart)} - {formatDate(business.currentPeriodEnd)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(business.totalRevenue)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total earned
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedBusiness(business)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadInvoice(business.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Download Invoice"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                        {business.paymentStatus === 'overdue' && (
                          <button
                            onClick={() => sendPaymentReminder(business.id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Send Reminder"
                          >
                            <EnvelopeIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBusiness(business);
                            setShowPaymentModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Edit Payment"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No businesses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Recent Payments Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.slice(0, 10).map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.invoiceNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.billingPeriod}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.businessName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.plan} Plan
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.status)}
                      <span className={getStatusBadge(payment.status)}>
                        {payment.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.paymentDate ? formatDate(payment.paymentDate) : 'Pending'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Due: {formatDate(payment.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadInvoice(payment.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download Invoice"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowInvoiceModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="View Invoice"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Details Modal */}
      {selectedBusiness && !showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedBusiness(null)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Business Payment Details</h3>
                  <button
                    onClick={() => setSelectedBusiness(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Business Info */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Business Information</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Name:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">{selectedBusiness.businessName}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Category:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">{selectedBusiness.businessCategory}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Address:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">{selectedBusiness.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Owner Information</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Name:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">{selectedBusiness.ownerName}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Email:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">{selectedBusiness.email}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Phone:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">{selectedBusiness.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Subscription Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Plan:</span>
                          <span className={getPlanBadge(selectedBusiness.subscriptionPlan)}>
                            {selectedBusiness.subscriptionPlan}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Status:</span>
                          <span className={getStatusBadge(selectedBusiness.subscriptionStatus)}>
                            {selectedBusiness.subscriptionStatus}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Monthly Amount:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {formatCurrency(selectedBusiness.monthlyAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Current Period:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {formatDate(selectedBusiness.currentPeriodStart)} - {formatDate(selectedBusiness.currentPeriodEnd)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Next Billing:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {formatDate(selectedBusiness.nextBillingDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Summary</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Payment Status:</span>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(selectedBusiness.paymentStatus)}
                            <span className={getStatusBadge(selectedBusiness.paymentStatus)}>
                              {selectedBusiness.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Total Revenue:</span>
                          <span className="ml-2 text-sm font-medium text-green-600">
                            {formatCurrency(selectedBusiness.totalRevenue)}
                          </span>
                        </div>
                        {selectedBusiness.outstandingAmount > 0 && (
                          <div>
                            <span className="text-sm text-gray-500">Outstanding:</span>
                            <span className="ml-2 text-sm font-medium text-red-600">
                              {formatCurrency(selectedBusiness.outstandingAmount)}
                            </span>
                          </div>
                        )}
                        {selectedBusiness.lastPaymentDate && (
                          <div>
                            <span className="text-sm text-gray-500">Last Payment:</span>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {formatDate(selectedBusiness.lastPaymentDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Payment History</h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Invoice</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Period</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {payments.filter(p => p.businessId === selectedBusiness.id).map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{payment.invoiceNumber}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{payment.billingPeriod}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(payment.amount)}</td>
                            <td className="px-4 py-2">
                              <span className={getStatusBadge(payment.status)}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {payment.paymentDate ? formatDate(payment.paymentDate) : 'Pending'}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => downloadInvoice(payment.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Download Invoice"
                              >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    setShowPaymentModal(true);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Manage Payment
                </button>
                {selectedBusiness.paymentStatus === 'overdue' && (
                  <button
                    onClick={() => sendPaymentReminder(selectedBusiness.id)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Send Reminder
                  </button>
                )}
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Management Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPaymentModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Payment Management</h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <form className="space-y-4">
                  {selectedBusiness && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-gray-700">{selectedBusiness.businessName}</h4>
                      <p className="text-sm text-gray-500">{selectedBusiness.ownerName}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                    <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="mark_paid">Mark as Paid</option>
                      <option value="record_payment">Record Payment</option>
                      <option value="refund">Issue Refund</option>
                      <option value="extend_trial">Extend Trial</option>
                      <option value="change_plan">Change Plan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="card">Credit/Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Transaction reference"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Add notes about this payment..."
                    />
                  </div>
                </form>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    toast.success('Payment updated successfully');
                    setShowPaymentModal(false);
                    setSelectedBusiness(null);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showInvoiceModal && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowInvoiceModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Invoice Preview</h3>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Invoice Content */}
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                      <p className="text-gray-600">{selectedPayment.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Invoice Date</p>
                      <p className="font-medium">{formatDate(selectedPayment.dueDate)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">From:</h3>
                      <p className="text-sm text-gray-600">
                        PetSync Platform<br />
                        Your Address Here<br />
                        City, State ZIP
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">To:</h3>
                      <p className="text-sm text-gray-600">
                        {selectedPayment.businessName}<br />
                        Business Address<br />
                        City, State ZIP
                      </p>
                    </div>
                  </div>

                  <table className="w-full mb-6">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">
                          {selectedPayment.plan} Plan Subscription<br />
                          <span className="text-sm text-gray-600">
                            Billing Period: {selectedPayment.billingPeriod}
                          </span>
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-900">
                        <td className="py-2 font-bold">Total</td>
                        <td className="text-right py-2 font-bold">
                          {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Payment Status:</p>
                      <span className={getStatusBadge(selectedPayment.status)}>
                        {selectedPayment.status}
                      </span>
                    </div>
                    {selectedPayment.transactionId && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Transaction ID:</p>
                        <p className="font-mono text-sm">{selectedPayment.transactionId}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => downloadInvoice(selectedPayment.id)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPaymentsSAdmin;