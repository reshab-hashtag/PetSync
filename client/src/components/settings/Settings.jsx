import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../../store/slices/authSlice';
import { setTheme } from '../../store/slices/uiSlice';
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CreditCardIcon,
  KeyIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    email: user?.profile?.email || '',
    phone: user?.profile?.phone || '',
    address: {
      street: user?.profile?.address?.street || '',
      city: user?.profile?.address?.city || '',
      state: user?.profile?.address?.state || '',
      zipCode: user?.profile?.address?.zipCode || '',
    }
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    ...(user?.role === 'business_admin' || user?.role === 'super_admin' 
      ? [{ id: 'business', name: 'Business', icon: BuildingOfficeIcon }] 
      : []),
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(updateUserProfile(formData));
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Update password logic here
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
        <p className="text-sm text-gray-500">Update your personal details and contact information.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="input-field mt-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="input-field mt-1"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="input-field mt-1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="input-field mt-1"
        />
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Address</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              className="input-field mt-1"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleInputChange}
                className="input-field mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center"
        >
          {loading && <LoadingSpinner size="sm" />}
          <span className={loading ? 'ml-2' : ''}>Save Changes</span>
        </button>
      </div>
    </form>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
        <p className="text-sm text-gray-500">Choose how you want to be notified about updates and activities.</p>
      </div>

      <div className="space-y-4">
        {Object.entries(notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 capitalize">
                {key === 'sms' ? 'SMS' : key} Notifications
              </h4>
              <p className="text-sm text-gray-500">
                {key === 'email' && 'Receive notifications via email'}
                {key === 'sms' && 'Receive notifications via text message'}
                {key === 'push' && 'Receive push notifications in your browser'}
                {key === 'marketing' && 'Receive marketing and promotional emails'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleNotificationChange(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
        <p className="text-sm text-gray-500">Manage your account security and password.</p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            className="input-field mt-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            className="input-field mt-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            className="input-field mt-1"
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading && <LoadingSpinner size="sm" />}
            <span className={loading ? 'ml-2' : ''}>Update Password</span>
          </button>
        </div>
      </form>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <button className="btn-secondary">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Appearance</h3>
        <p className="text-sm text-gray-500">Customize how the application looks and feels.</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">Theme</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {['light', 'dark', 'system'].map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => dispatch(setTheme(themeOption))}
              className={`p-4 border rounded-lg text-left transition-colors ${
                theme === themeOption
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium capitalize">{themeOption}</div>
              <div className="text-sm text-gray-500 mt-1">
                {themeOption === 'light' && 'Light mode'}
                {themeOption === 'dark' && 'Dark mode'}
                {themeOption === 'system' && 'Follow system preference'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Billing & Subscription</h3>
        <p className="text-sm text-gray-500">Manage your subscription and billing information.</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Current Plan</h4>
            <p className="text-sm text-gray-500">Professional Plan - $29/month</p>
          </div>
          <button className="btn-secondary">
            Change Plan
          </button>
        </div>
      </div>

      <div className="card">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCardIcon className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <p className="font-medium">**** **** **** 4242</p>
              <p className="text-sm text-gray-500">Expires 12/2026</p>
            </div>
          </div>
          <button className="btn-secondary">
            Update
          </button>
        </div>
      </div>
    </div>
  );

  const renderBusinessTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Business Settings</h3>
        <p className="text-sm text-gray-500">Manage your business information and preferences.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Name</label>
          <input
            type="text"
            className="input-field mt-1"
            defaultValue="Happy Paws Veterinary Clinic"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Type</label>
          <select className="input-field mt-1">
            <option>Veterinary Clinic</option>
            <option>Pet Grooming</option>
            <option>Pet Boarding</option>
            <option>Pet Training</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Hours</label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs text-gray-500">Monday - Friday</label>
              <div className="flex space-x-2">
                <input type="time" className="input-field" defaultValue="09:00" />
                <input type="time" className="input-field" defaultValue="17:00" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Saturday - Sunday</label>
              <div className="flex space-x-2">
                <input type="time" className="input-field" defaultValue="10:00" />
                <input type="time" className="input-field" defaultValue="16:00" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">
          Save Business Settings
        </button>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      case 'appearance':
        return renderAppearanceTab();
      case 'billing':
        return renderBillingTab();
      case 'business':
        return renderBusinessTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;