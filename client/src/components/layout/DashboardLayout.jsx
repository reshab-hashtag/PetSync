import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getCurrentUser } from '../../store/slices/authSlice';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  return (
    <div>
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;