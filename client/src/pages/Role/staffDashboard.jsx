import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StatCard from '../../components/dashboard/StatCard';
import { 
  fetchAppointments, 
  selectAppointments, 
  selectAppointmentLoading 
} from '../../store/slices/appointmentSlice';

const StaffDashboard = ({ 
  overview, 
  CalendarIcon, 
  ClockIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon 
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const appointments = useSelector(selectAppointments);
  const isLoading = useSelector(selectAppointmentLoading);

  console.log(appointments)

  // Fetch appointments on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchAppointments({
        limit: 100, 
      }));
    }
  }, [dispatch, user]);

  // Calculate today's appointments
  const todaysAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    return appointments.filter(appointment => {
      // Check if appointment is for today
      let appointmentDate;

      // Handle different date formats
      if (appointment.schedule?.date) {
        appointmentDate = new Date(appointment.schedule.date).toISOString().split('T')[0];
      } else if (appointment.schedule?.startTime) {
        appointmentDate = new Date(appointment.schedule.startTime).toISOString().split('T')[0];
      } else if (appointment.date) {
        appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
      }

      return appointmentDate === todayDateString;
    }).sort((a, b) => {
      // Sort by start time
      const timeA = new Date(a.schedule?.startTime || a.startTime);
      const timeB = new Date(b.schedule?.startTime || b.startTime);
      return timeA - timeB;
    });
  }, [appointments]);

  // Calculate upcoming appointments (future appointments excluding today)
  const upcomingAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999); // End of today

    return appointments.filter(appointment => {
      let appointmentDate;

      // Handle different date formats
      if (appointment.schedule?.startTime) {
        appointmentDate = new Date(appointment.schedule.startTime);
      } else if (appointment.schedule?.date) {
        appointmentDate = new Date(appointment.schedule.date);
      } else if (appointment.date) {
        appointmentDate = new Date(appointment.date);
      }

      // Return appointments that are after today and not cancelled
      return appointmentDate > todayEnd && 
             appointment.status !== 'cancelled' && 
             appointment.status !== 'completed';
    });
  }, [appointments]);

  // Calculate completed appointments this month
  const completedThisMonth = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return appointments.filter(appointment => {
      // Only count completed appointments
      if (appointment.status !== 'completed') return false;

      let appointmentDate;

      // Handle different date formats
      if (appointment.schedule?.startTime) {
        appointmentDate = new Date(appointment.schedule.startTime);
      } else if (appointment.schedule?.date) {
        appointmentDate = new Date(appointment.schedule.date);
      } else if (appointment.date) {
        appointmentDate = new Date(appointment.date);
      } else if (appointment.updatedAt) {
        // Use updatedAt as fallback for completion date
        appointmentDate = new Date(appointment.updatedAt);
      }

      return appointmentDate >= startOfMonth && appointmentDate <= endOfMonth;
    });
  }, [appointments]);

  // Calculate revenue from completed appointments this month
  const revenueThisMonth = useMemo(() => {
    return completedThisMonth.reduce((total, appointment) => {
      // Calculate revenue from service price or appointment total
      const amount = appointment.service?.price || 
                    appointment.total || 
                    appointment.amount || 
                    0;
      return total + (typeof amount === 'number' ? amount : 0);
    }, 0);
  }, [completedThisMonth]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Appointments"
          value={isLoading ? "..." : todaysAppointments.length}
          icon={CalendarIcon}
          color="primary"
        />
        <StatCard
          title="Upcoming Appointments"
          value={isLoading ? "..." : upcomingAppointments.length}
          icon={ClockIcon}
          color="blue"
        />
        <StatCard
          title="Completed This Month"
          value={isLoading ? "..." : completedThisMonth.length}
          icon={ChartBarIcon}
          color="green"
        />
        <StatCard
          title="Revenue Generated"
          value={isLoading ? "..." : `$${revenueThisMonth.toLocaleString()}`}
          icon={CurrencyDollarIcon}
          color="yellow"
        />
      </div>

      {/* Today's Schedule Section */}
      <div className="mt-8">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">My Schedule Today</h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading schedule...</p>
            </div>
          ) : todaysAppointments.length > 0 ? (
            <div className="space-y-4">
              {todaysAppointments.map((appointment) => (
                <div key={appointment._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {appointment.client?.profile?.firstName || appointment.client?.name || 'Unknown Client'} {appointment.client?.profile?.lastName || ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointment.pet?.profile?.name || appointment.pet?.name || 'Unknown Pet'} 
                      {appointment.pet?.profile?.species && ` (${appointment.pet.profile.species})`} - 
                      {appointment.service?.name || appointment.serviceType || 'Service'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.schedule?.startTime 
                        ? new Date(appointment.schedule.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : appointment.schedule?.time || 'Time TBD'
                      }
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                      appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No appointments scheduled for today</p>
          )}
        </div>
      </div>
    </>
  );
};

export default StaffDashboard;