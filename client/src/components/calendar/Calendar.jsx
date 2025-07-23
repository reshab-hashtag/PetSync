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
  Bars3Icon,
  XMarkIcon,
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
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // Fetch appointments on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchAppointments({
        limit: 100, // Fetch more appointments for calendar view
      }));
    }
  }, [dispatch, user]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Transform Redux appointment data to match calendar format
  const transformAppointmentData = (appointment) => {
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
      endTime = new Date(startTime.getTime() + 30 * 60000);
    }

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

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (window.innerWidth < 1024) { // Mobile/tablet
      setShowMobileDetails(true);
    }
  };

  const renderCalendarGrid = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDaysMobile = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              <span className="hidden sm:inline">{format(currentDate, 'MMMM yyyy')}</span>
              <span className="sm:hidden">{format(currentDate, 'MMM yyyy')}</span>
            </h2>
            <div className="flex space-x-1">
              <button
                onClick={previousMonth}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-100 border border-gray-300 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="btn-primary flex items-center text-xs sm:text-sm px-2 sm:px-3 py-1.5"
            >
              <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">New</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekDays.map((day, index) => (
            <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-500">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{weekDaysMobile[index]}</span>
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
                className={`min-h-[60px] sm:min-h-[100px] lg:min-h-[120px] p-1 sm:p-2 border-b border-r cursor-pointer hover:bg-gray-50 transition-colors ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                  } ${isSelectedDay ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => handleDateSelect(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs sm:text-sm font-medium flex items-center justify-center ${isTodayDay
                      ? 'bg-blue-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6'
                      : isSelectedDay
                        ? 'text-blue-600'
                        : isCurrentMonth
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayAppointments.length > 0 && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>

                {/* Desktop/Tablet Appointment Preview */}
                <div className="hidden sm:block space-y-1">
                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`text-xs p-1 rounded text-white truncate ${appointment.color}`}
                      title={`${format(appointment.startTime, 'h:mm a')} - ${appointment.title}`}
                    >
                      <div className="font-medium">{format(appointment.startTime, 'h:mm a')}</div>
                      <div className="truncate">{appointment.pet}</div>
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 2}
                    </div>
                  )}
                </div>

                {/* Mobile Appointment Count */}
                <div className="sm:hidden">
                  {dayAppointments.length > 0 && (
                    <div className="text-xs text-center text-gray-600 mt-1">
                      {dayAppointments.length}
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

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden mt-10 lg:mt-0 m-4 lg:m-0">
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                <span className="hidden sm:inline">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                <span className="sm:hidden">{format(selectedDate, 'MMM d, yyyy')}</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            {showMobileDetails && (
              <button
                onClick={() => setShowMobileDetails(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-xs sm:text-sm text-gray-500">Loading appointments...</p>
            </div>
          ) : selectedDateAppointments.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <CalendarDaysIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                No appointments scheduled for this date.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="btn-primary flex items-center mx-auto text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {selectedDateAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center p-3 sm:p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${appointment.color} mr-3 sm:mr-4 flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {appointment.pet} - {appointment.service}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center mt-1 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span>
                          {format(appointment.startTime, 'h:mm a')} - {format(appointment.endTime, 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{appointment.client}</span>
                      </div>
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm sm:text-base text-gray-600">Schedule and manage appointments</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex rounded-md shadow-sm">
            {['month', 'week', 'day'].map((viewOption) => (
              <button
                key={viewOption}
                onClick={() => setView(viewOption)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border transition-colors ${view === viewOption
                  ? 'bg-blue-50 border-blue-500 text-blue-700 z-10'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  } ${viewOption === 'month' ? 'rounded-l-md' :
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          {renderCalendarGrid()}
        </div>

        {/* Appointments List - Desktop */}
        <div className="hidden lg:block">
          {renderAppointmentsList()}
        </div>
      </div>

      {/* Mobile Appointments Panel */}
      <div>
        {showMobileDetails && (
          <div class="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-md">
            <div className="h-fit flex flex-col">
              {renderAppointmentsList()}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-100 text-blue-600">
                <CalendarDaysIcon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Today's</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {todaysAppointments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 sm:p-3 rounded-lg bg-green-100 text-green-600">
                <ClockIcon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">This Week</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {appointments ? appointments.length : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 sm:p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <UserIcon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {pendingAppointments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 sm:p-3 rounded-lg bg-purple-100 text-purple-600">
                <CalendarDaysIcon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
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