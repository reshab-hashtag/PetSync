import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import format from 'date-fns/format';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import isSameMonth from 'date-fns/isSameMonth';
import isToday from 'date-fns/isToday';
import isSameDay from 'date-fns/isSameDay';
import { 
  fetchAppointments, 
  selectAppointments, 
  selectAppointmentLoading 
} from '../../store/slices/appointmentSlice';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const Calendar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const appointments = useSelector(selectAppointments);
  const isLoading = useSelector(selectAppointmentLoading);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Fetch appointments on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchAppointments({
        limit: 100, // Fetch more appointments for calendar view
        // You can add date filters here if needed
      }));
    }
  }, [dispatch, user]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Transform Redux appointment data to match calendar format
  const transformAppointmentData = (appointment) => {
    // Handle different date/time formats from the API
    let startTime, endTime;
    
    if (appointment.schedule?.startTime) {
      startTime = new Date(appointment.schedule.startTime);
    } else if (appointment.schedule?.date && appointment.schedule?.time) {
      startTime = new Date(`${appointment.schedule.date}T${appointment.schedule.time}`);
    } else if (appointment.date && appointment.time) {
      startTime = new Date(`${appointment.date}T${appointment.time}`);
    } else {
      startTime = new Date(appointment.createdAt);
    }

    if (appointment.schedule?.endTime) {
      endTime = new Date(appointment.schedule.endTime);
    } else {
      // If no end time, assume 30 minutes duration
      endTime = new Date(startTime.getTime() + 30 * 60000);
    }

    // Determine status color
    const getStatusColor = (status) => {
      switch (status) {
        case 'confirmed':
          return 'bg-green-500';
        case 'pending':
          return 'bg-yellow-500';
        case 'in_progress':
          return 'bg-blue-500';
        case 'completed':
          return 'bg-purple-500';
        case 'cancelled':
          return 'bg-red-500';
        default:
          return 'bg-gray-500';
      }
    };

    return {
      id: appointment._id,
      title: `${appointment.pet?.profile.name || 'Unknown Pet'} - ${appointment.service?.name || appointment.serviceType}`,
      client: appointment.client?.fullName || appointment.clientName || 'Unknown Client',
      pet: appointment.pet?.profile.name || 'Unknown Pet',
      service: appointment.service?.name || appointment.serviceType || 'Service',
      startTime,
      endTime,
      status: appointment.status || 'pending',
      color: getStatusColor(appointment.status),
      originalAppointment: appointment
    };
  };

  const getAppointmentsForDate = (date) => {
    if (!appointments || appointments.length === 0) return [];
    
    return appointments
      .map(transformAppointmentData)
      .filter(appointment => isSameDay(appointment.startTime, date));
  };

  const getAppointmentsForSelectedDate = () => {
    return getAppointmentsForDate(selectedDate).sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };
  

  const renderCalendarGrid = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex space-x-1">
              <button
                onClick={previousMonth}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Today
            </button>
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="btn-primary flex items-center text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              New Appointment
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, dayIdx) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelectedDay = isSameDay(day, selectedDate);
            const isTodayDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`min-h-[120px] p-2 border-b border-r cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isSelectedDay ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isTodayDay
                        ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                        : isSelectedDay
                        ? 'text-blue-600'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`text-xs p-1 rounded text-white truncate ${appointment.color}`}
                      title={`${format(appointment.startTime, 'h:mm a')} - ${appointment.title}`}
                    >
                      {format(appointment.startTime, 'h:mm a')} {appointment.pet}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAppointmentsList = () => {
    const selectedDateAppointments = getAppointmentsForSelectedDate();

    console.log(selectedDateAppointments)

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <p className="text-sm text-gray-500">
            {selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading appointments...</p>
            </div>
          ) : selectedDateAppointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                No appointments scheduled for this date.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="btn-primary flex items-center mx-auto"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className={`w-3 h-3 rounded-full ${appointment.color} mr-4`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {appointment.pet} - {appointment.service}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>
                        {format(appointment.startTime, 'h:mm a')} - {format(appointment.endTime, 'h:mm a')}
                      </span>
                      <UserIcon className="h-4 w-4 ml-4 mr-1" />
                      <span>{appointment.client}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate stats from Redux appointments
  const todaysAppointments = appointments ? appointments.filter(appointment => {
    const today = new Date();
    let appointmentDate;
    
    if (appointment.schedule?.startTime) {
      appointmentDate = new Date(appointment.schedule.startTime);
    } else if (appointment.schedule?.date) {
      appointmentDate = new Date(appointment.schedule.date);
    } else if (appointment.date) {
      appointmentDate = new Date(appointment.date);
    } else {
      return false;
    }
    
    return isSameDay(appointmentDate, today);
  }) : [];

  const pendingAppointments = appointments ? appointments.filter(apt => apt.status === 'pending') : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Schedule and manage appointments</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex rounded-md shadow-sm">
            {['month', 'week', 'day'].map((viewOption) => (
              <button
                key={viewOption}
                onClick={() => setView(viewOption)}
                className={`px-3 py-2 text-sm font-medium border ${
                  view === viewOption
                    ? 'bg-primary-50 border-primary-500 text-primary-700 z-10'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                } ${
                  viewOption === 'month' ? 'rounded-l-md' :
                  viewOption === 'day' ? 'rounded-r-md -ml-px' :
                  '-ml-px'
                }`}
              >
                {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {renderCalendarGrid()}
        </div>
        <div>
          {renderAppointmentsList()}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <CalendarDaysIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">
                {todaysAppointments.length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <ClockIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments ? appointments.length : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <UserIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingAppointments.length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <CalendarDaysIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments ? appointments.length : 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;