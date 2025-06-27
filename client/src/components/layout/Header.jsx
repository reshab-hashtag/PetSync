import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { setSidebarOpen } from '../../store/slices/uiSlice';
import { logoutUser } from '../../store/slices/authSlice';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate('/login');
    });
  };

  const userNavigation = [
    { name: 'Your Profile', icon: UserCircleIcon, onClick: () => navigate('/profile') },
    { name: 'Settings', icon: CogIcon, onClick: () => navigate('/settings') },
    { name: 'Sign out', icon: ArrowRightOnRectangleIcon, onClick: handleLogout },
  ];

  return (
    <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
      <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(true))}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 lg:hidden" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="relative flex flex-1 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome back, {user?.profile?.firstName || user?.fullName || 'User'}!
            </h1>
          </div>
          
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notifications */}
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
            >
              <BellIcon className="h-6 w-6" />
            </button>

            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="-m-1.5 flex items-center p-1.5">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.profile?.firstName?.[0] || user?.fullName?.[0] || 'U'}
                  </span>
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                    {user?.profile?.firstName} {user?.profile?.lastName}
                  </span>
                </span>
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                  {userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        <button
                          onClick={item.onClick}
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } flex w-full items-center px-3 py-1 text-sm leading-6 text-gray-900`}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;