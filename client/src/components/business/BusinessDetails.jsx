// client/src/components/business/BusinessDetails.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { fetchBusinessDetails } from '../../store/slices/businessSlice';
import LoadingSpinner from '../common/LoadingSpinner';

const BusinessDetails = ({ business, onClose }) => {
  const dispatch = useDispatch();
  const [detailedBusiness, setDetailedBusiness] = useState(business);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadBusinessDetails = async () => {
      setLoading(true);
      try {
        const result = await dispatch(fetchBusinessDetails(business._id)).unwrap();
        setDetailedBusiness(result.data.business);
      } catch (error) {
        console.error('Failed to load business details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (business._id) {
      loadBusinessDetails();
    }
  }, [business._id, dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircleIcon className="w-4 h-4 mr-1" />
            Inactive
          </>
        )}
      </span>
    );
  };

  const getSubscriptionBadge = (subscription) => {
    const styles = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800'
    };

    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <div className="flex space-x-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[subscription?.plan] || styles.free}`}>
          {subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1) || 'Free'}
        </span>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles[subscription?.status] || statusStyles.active}`}>
          {subscription?.status?.charAt(0).toUpperCase() + subscription?.status?.slice(1) || 'Active'}
        </span>
      </div>
    );
  };

  // Mock chart data (you can replace with real data from API)
  const revenueData = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 15000 },
    { month: 'Mar', revenue: 18000 },
    { month: 'Apr', revenue: 14000 },
    { month: 'May', revenue: 20000 },
    { month: 'Jun', revenue: 25000 }
  ];

  const serviceData = detailedBusiness.services?.slice(0, 5).map(service => ({
    name: service.name,
    bookings: Math.floor(Math.random() * 100) + 20,
    revenue: service.price?.amount || 0
  })) || [];

  const appointmentStatusData = [
    { name: 'Completed', value: 65, color: '#10B981' },
    { name: 'Scheduled', value: 20, color: '#3B82F6' },
    { name: 'Cancelled', value: 10, color: '#EF4444' },
    { name: 'No Show', value: 5, color: '#6B7280' }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'staff', name: 'Staff', icon: UserGroupIcon },
    { id: 'services', name: 'Services', icon: CalendarIcon },
    { id: 'settings', name: 'Settings', icon: BuildingOfficeIcon }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Business Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-white/20 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{detailedBusiness.profile.name}</h1>
              <p className="text-indigo-100 mt-1">{detailedBusiness.profile.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge(detailedBusiness.isActive)}
                {getSubscriptionBadge(detailedBusiness.subscription)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 text-white mr-2" />
              <div>
                <p className="text-2xl font-bold">{detailedBusiness.staff?.length || 0}</p>
                <p className="text-indigo-100 text-sm">Staff Members</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 text-white mr-2" />
              <div>
                <p className="text-2xl font-bold">{detailedBusiness.metrics?.totalAppointments || 0}</p>
                <p className="text-indigo-100 text-sm">Appointments</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 text-white mr-2" />
              <div>
                <p className="text-2xl font-bold">
                  {detailedBusiness.metrics?.totalRevenue ? 
                    formatCurrency(detailedBusiness.metrics.totalRevenue).replace('₹', '') : '0'
                  }
                </p>
                <p className="text-indigo-100 text-sm">Revenue</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 text-white mr-2" />
              <div>
                <p className="text-2xl font-bold">{detailedBusiness.metrics?.averageRating || '0.0'}</p>
                <p className="text-indigo-100 text-sm">Avg Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Appointment Status */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={appointmentStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {appointmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Service Performance */}
            <div className="bg-white p-6 rounded-lg border lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Staff Members</h3>
              <p className="text-sm text-gray-500">Manage your business staff and their roles</p>
            </div>
            <div className="divide-y divide-gray-200">
              {detailedBusiness.staff?.map((staffMember) => (
                <div key={staffMember._id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {staffMember.profile.firstName} {staffMember.profile.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{staffMember.profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staffMember.role === 'business_admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {staffMember.role === 'business_admin' ? 'Admin' : 'Staff'}
                    </span>
                    {getStatusBadge(staffMember.isActive)}
                  </div>
                </div>
              ))}
              {(!detailedBusiness.staff || detailedBusiness.staff.length === 0) && (
                <div className="px-6 py-8 text-center">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
                  <p className="mt-1 text-sm text-gray-500">No staff members have been added to this business yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Services Offered</h3>
              <p className="text-sm text-gray-500">Services provided by this business</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {detailedBusiness.services?.map((service, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      <div className="mt-2">
                        <span className="text-lg font-bold text-indigo-600">
                          {formatCurrency(service.price?.amount)}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      {service.category}
                    </span>
                  </div>
                </div>
              ))}
              {(!detailedBusiness.services || detailedBusiness.services.length === 0) && (
                <div className="col-span-full text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
                  <p className="mt-1 text-sm text-gray-500">No services have been configured for this business.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Business Information */}
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Details</h4>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-3" />
                        <span>{detailedBusiness.profile.email || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-3" />
                        <span>{detailedBusiness.profile.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-3" />
                        <span>{detailedBusiness.profile.website || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Address</h4>
                    <div className="flex items-start text-sm">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        {detailedBusiness.profile.address ? (
                          <>
                            <p>{detailedBusiness.profile.address.street}</p>
                            <p>{detailedBusiness.profile.address.city}, {detailedBusiness.profile.address.state}</p>
                            <p>{detailedBusiness.profile.address.zipCode}</p>
                            <p>{detailedBusiness.profile.address.country}</p>
                          </>
                        ) : (
                          <span className="text-gray-500">Address not provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Business Hours</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {detailedBusiness.schedule?.workingHours && Object.entries(detailedBusiness.schedule.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">{day}</span>
                      <span className="text-sm text-gray-600">
                        {hours.isOpen 
                          ? `${hours.open} - ${hours.close}`
                          : 'Closed'
                        }
                      </span>
                    </div>
                  ))}
                </div>
                {detailedBusiness.schedule?.timezone && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Timezone: {detailedBusiness.schedule.timezone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${detailedBusiness.settings?.paymentMethods?.cash ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Cash</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${detailedBusiness.settings?.paymentMethods?.card ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Card</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${detailedBusiness.settings?.paymentMethods?.online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Subscription Details</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Plan</h4>
                    <p className="text-sm text-gray-600 mt-1 capitalize">
                      {detailedBusiness.subscription?.plan || 'Free'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Status</h4>
                    <p className="text-sm text-gray-600 mt-1 capitalize">
                      {detailedBusiness.subscription?.status || 'Active'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Expires</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {detailedBusiness.subscription?.expiresAt 
                        ? formatDate(detailedBusiness.subscription.expiresAt)
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Created</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(detailedBusiness.createdAt)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Last Updated</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(detailedBusiness.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDetails;