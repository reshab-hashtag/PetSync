import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const ClientList = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockClients = [
      {
        _id: '1',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@email.com',
          phone: '+1 (555) 123-4567',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001'
          }
        },
        pets: [
          { _id: 'p1', profile: { name: 'Buddy', species: 'Dog' } },
          { _id: 'p2', profile: { name: 'Max', species: 'Dog' } }
        ],
        totalAppointments: 15,
        lastVisit: new Date(2025, 4, 20),
        totalSpent: 750,
        status: 'active',
        createdAt: new Date(2024, 8, 15)
      },
      {
        _id: '2',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@email.com',
          phone: '+1 (555) 987-6543',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210'
          }
        },
        pets: [
          { _id: 'p3', profile: { name: 'Whiskers', species: 'Cat' } }
        ],
        totalAppointments: 8,
        lastVisit: new Date(2025, 5, 15),
        totalSpent: 420,
        status: 'active',
        createdAt: new Date(2024, 10, 2)
      },
      {
        _id: '3',
        profile: {
          firstName: 'Robert',
          lastName: 'Johnson',
          email: 'rob.johnson@email.com',
          phone: '+1 (555) 456-7890',
          address: {
            street: '789 Pine Rd',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601'
          }
        },
        pets: [
          { _id: 'p4', profile: { name: 'Bella', species: 'Dog' } },
          { _id: 'p5', profile: { name: 'Charlie', species: 'Cat' } },
          { _id: 'p6', profile: { name: 'Luna', species: 'Rabbit' } }
        ],
        totalAppointments: 22,
        lastVisit: new Date(2025, 5, 10),
        totalSpent: 1250,
        status: 'active',
        createdAt: new Date(2024, 6, 8)
      }
    ];
    
    setTimeout(() => {
      setClients(mockClients);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredClients = clients.filter(client =>
    `${client.profile.firstName} ${client.profile.lastName} ${client.profile.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your client base and their information</p>
        </div>
        <button className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name or email..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <UserGroupIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <UserGroupIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <UserGroupIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Pets</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.reduce((sum, client) => sum + client.pets.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <UserGroupIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${clients.reduce((sum, client) => sum + client.totalSpent, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first client.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <div key={client._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {client.profile.firstName[0]}{client.profile.lastName[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {client.profile.firstName} {client.profile.lastName}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      <span className="truncate">{client.profile.email}</span>
                    </div>
                    {client.profile.phone && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        <span>{client.profile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button className="p-1 text-blue-600 hover:text-blue-900">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-yellow-600 hover:text-yellow-900">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-red-600 hover:text-red-900">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pets:</span>
                  <span className="font-medium text-gray-900">{client.pets.length}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {client.pets.slice(0, 3).map((pet) => (
                    <span
                      key={pet._id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {pet.profile.name}
                    </span>
                  ))}
                  {client.pets.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{client.pets.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Appointments:</span>
                    <div className="font-medium text-gray-900">{client.totalAppointments}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Spent:</span>
                    <div className="font-medium text-gray-900">${client.totalSpent}</div>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Last Visit:</span>
                  <div className="font-medium text-gray-900">
                    {client.lastVisit.toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 btn-secondary text-sm py-2">
                  View Details
                </button>
                <button className="btn-primary text-sm py-2 px-4">
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientList;