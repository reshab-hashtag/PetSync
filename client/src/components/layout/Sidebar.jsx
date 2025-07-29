import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { setSidebarOpen } from '../../store/slices/uiSlice';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  CogIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  PlusCircleIcon,
  HeartIcon,
  CalendarDaysIcon,
  UsersIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      roles: ['super_admin', 'business_admin', 'staff', 'client']
    },
    {
      name: 'Appointments',
      href: '/dashboard/appointments',
      icon: CalendarIcon,
      roles: ['business_admin', 'staff', 'client']
    },
    {
      name: 'Clients',
      href: '/dashboard/clients',
      icon: UserGroupIcon,
      roles: ['business_admin']
    },
    {
      name: 'Pets',
      href: '/dashboard/pets',
      icon: HeartIcon,
      roles: ['business_admin', 'staff', 'client']
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: CalendarDaysIcon,
      roles: ['business_admin', 'staff']
    },
    {
      name: 'Staff Management',
      href: '/dashboard/staff',
      icon: UsersIcon,
      roles: ['business_admin'] // Only business admins can access staff management
    },
    {
      name: 'Services',
      href: '/dashboard/services',
      icon: WrenchScrewdriverIcon,
      roles: ['business_admin'] // Only business admins and super admins can manage services
    },
    {
      name: 'Business Management', // Add this new navigation item
      href: '/dashboard/businesses',
      icon: BuildingOfficeIcon,
      roles: ['business_admin'] // Only business admins can access business management
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CurrencyDollarIcon,
      roles: ['business_admin']
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: CogIcon,
      roles: ['super_admin', 'business_admin', 'staff', 'client']
    }
  ];


  // Super Admin specific navigation items
  const superAdminNavigation = [
    {
      name: 'Register Business',
      href: '/dashboard/register-business-admin',
      icon: BuildingOfficeIcon,
      current: location.pathname === '/register-business-admin',
      roles: ['super_admin'],
      isSpecial: true,
      description: 'Add new business admin'
    },
    {
      name: 'Business Categories',
      href: '/dashboard/admin/categories',
      icon: Squares2X2Icon,
      current: location.pathname === '/admin/categories',
      roles: ['super_admin'],
      isSpecial: true,
      description: 'Manage business categories'
    },
     {
      name: 'Business Payments',
      href: '/dashboard/admin/business-payments',
      icon: CurrencyEuroIcon,
      current: location.pathname === 'admin/business-payments',
      roles: ['super_admin'],
      isSpecial: true,
      description: 'Manage business payments'
    },
  ];

  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    if (!user?.role) return [];

    let filteredNav = [];

    // Filter base navigation by user role
    filteredNav = navigation.filter(item =>
      item.roles.includes(user.role)
    );

    // Add super admin specific items after Dashboard
    if (user.role === 'super_admin') {
      // Insert super admin items after Dashboard (index 1)
      const dashboardIndex = filteredNav.findIndex(item => item.name === 'Dashboard');
      if (dashboardIndex !== -1) {
        filteredNav.splice(dashboardIndex + 1, 0, ...superAdminNavigation);
      }
    }

    // Special handling for pet owners - they see a simplified view
    if (user.role === 'client') {
      filteredNav = filteredNav.filter(item =>
        ['Dashboard', 'Appointments', 'Pets', 'Billing', 'Messages', 'Settings'].includes(item.name)
      );
    }

    return filteredNav;
  };

  const filteredNavigation = getFilteredNavigation();

  const getUserRoleInfo = () => {
    switch (user?.role) {
      case 'super_admin':
        return { color: 'bg-red-500', label: 'Super Admin', textColor: 'text-red-600' };
      case 'business_admin':
        return { color: 'bg-blue-500', label: 'Business Admin', textColor: 'text-blue-600' };
      case 'staff':
        return { color: 'bg-green-500', label: 'Staff', textColor: 'text-green-600' };
      case 'client':
        return { color: 'bg-purple-500', label: 'Pet Owner', textColor: 'text-purple-600' };
      default:
        return { color: 'bg-gray-500', label: 'User', textColor: 'text-gray-600' };
    }
  };

  const roleInfo = getUserRoleInfo();

  return (
    <>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => dispatch(setSidebarOpen(false))} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => dispatch(setSidebarOpen(false))}
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                <div className="flex h-16 shrink-0 items-center">
                  <img
                    className="h-8 w-auto"
                    src="/logo.png"
                    alt="PetSync"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <span className="hidden ml-2 text-xl font-bold text-primary-600">PetSync</span>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul className="-mx-2 space-y-1">
                        {filteredNavigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              className={`sidebar-item ${item.current ? 'sidebar-item-active' : 'sidebar-item-inactive'
                                } ${item.isSpecial ? 'relative' : ''}`}
                              onClick={() => dispatch(setSidebarOpen(false))}
                              title={item.description || item.name}
                            >
                              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                              {item.name}
                              {item.isSpecial && (
                                <PlusCircleIcon className="ml-auto h-4 w-4 text-primary-500" />
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>

                    {/* User Info Section */}
                    {user && (
                      <li className="mt-auto">
                        <div className="px-3 py-3 border-t border-gray-200">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${roleInfo.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.profile?.firstName} {user.profile?.lastName}
                              </p>
                              <p className={`text-xs ${roleInfo.textColor} font-medium`}>
                                {roleInfo.label}
                              </p>
                            </div>
                          </div>
                          {user.role === 'business_admin' && user.businessName && (
                            <div className="mt-2 text-xs text-gray-500">
                              {user.businessName}
                            </div>
                          )}
                        </div>
                      </li>
                    )}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="/logo.png"
              alt="PetSync"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="hidden ml-2 text-xl font-bold text-primary-600">PetSync</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`sidebar-item ${item.current ? 'sidebar-item-active' : 'sidebar-item-inactive'
                          } ${item.isSpecial ? 'relative' : ''}`}
                        title={item.description || item.name}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                        {item.isSpecial && (
                          <PlusCircleIcon className="ml-auto h-4 w-4 text-primary-500" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* User Info Section */}
              {user && (
                <li className="mt-auto">
                  <div className="px-3 py-3 border-t border-gray-200">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${roleInfo.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </p>
                        <p className={`text-xs ${roleInfo.textColor} font-medium`}>
                          {roleInfo.label}
                        </p>
                      </div>
                      {user.role === 'super_admin' && (
                        <div className="ml-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Admin
                          </span>
                        </div>
                      )}
                    </div>
                    {user.role === 'business_admin' && user.businessName && (
                      <div className="mt-2 text-xs text-gray-500 truncate">
                        {user.businessName}
                      </div>
                    )}
                  </div>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;