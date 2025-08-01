import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Auth
import LoginForm from './components/auth/LoginForm';
// import RegisterForm from './components/auth/RegisterForm';

// Pages
import Dashboard       from './pages/Dashboard';
import AppointmentList from './components/appointments/AppointmentList';
import ClientList      from './components/clients/ClientList';
import PetList         from './components/pets/PetList';
import Calendar        from './components/calendar/Calendar';
import Billing         from './components/billing/Billing';
import Profile         from './components/profile/Profile';
import Settings        from './components/settings/Settings';

import './App.css';
import BusinessAdminRegistrationForm from './components/auth/BusinessAdminRegistrationForm.jsx';
import StaffList from './components/staff/StaffList.jsx';
import BusinessList from './components/business/BusinessList.jsx';
import SuperAdminCategories from './components/admin/SuperAdminCategories.jsx';
import LandingDashboard from './pages/LandingDashboard.jsx';
import ServiceManagement from './components/services/ServiceManagement.jsx';
import TempChatComponent from './components/chat/TempChatComponent.jsx';
import { useSelector } from 'react-redux';
import BusinessPaymentsSAdmin from './components/business/BusinessPaymentsSAdmin.jsx';

function App() {
   const { user } = useSelector((state) => state.auth);

  return (
      <Router>
          <Routes>
            {/* Public */}
             <Route path="/" element={<LandingDashboard />} />
            <Route path="/search" element={<LandingDashboard />} />
            <Route path="/login"   element={<LoginForm />} />
            {/* <Route path="/register" element={<RegisterForm />} /> */}



            {/* Protected – layout + nested dashboard routes */}
             <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="appointments" element={<AppointmentList />} />
              <Route path="clients" element={<ClientList />} />
              <Route path="pets" element={<PetList />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="billing" element={<Billing />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="staff" element={<StaffList />} />
              <Route path="businesses" element={<BusinessList />} />
              <Route path="services" element={<ServiceManagement />} />
              <Route path="register-business-admin" element={<BusinessAdminRegistrationForm />} />
              <Route path="admin/categories" element={<SuperAdminCategories />} />
              <Route path="admin/business-payments" element={<BusinessPaymentsSAdmin />} />
              {/* 404 under the dashboard layout */}
              <Route
                path="*"
                element={
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Page Not Found
                    </h1>
                    <p className="mt-2 text-gray-600">
                      The page you’re looking for doesn’t exist.
                    </p>
                    <button
                      onClick={() => window.history.back()}
                      className="mt-4 btn-primary"
                    >
                      Go Back
                    </button>
                  </div>
                }
              />
            </Route>
          </Routes>
            {user &&
              ["client", "staff"].includes(user.role) &&
                <TempChatComponent />
            }


          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
              success: { style: { background: '#10B981' } },
              error:   { style: { background: '#EF4444' } },
            }}
          />
      </Router>
  );
}

export default App;
