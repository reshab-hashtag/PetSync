import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const PetList = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    species: 'all',
    status: 'all',
  });

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockPets = [
      {
        _id: '1',
        profile: {
          name: 'Buddy',
          species: 'Dog',
          breed: 'Golden Retriever',
          gender: 'Male',
          dateOfBirth: new Date(2020, 2, 15),
          weight: 65,
          color: 'Golden',
          microchipId: 'MC123456789',
          notes: 'Very friendly and energetic. Loves treats and belly rubs.',
        },
        owner: {
          _id: 'c1',
          profile: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
        },
        medicalHistory: [
          { date: new Date(2025, 4, 15), type: 'Vaccination', description: 'Annual shots' },
          { date: new Date(2025, 2, 10), type: 'Checkup', description: 'Healthy checkup' }
        ],
        upcomingAppointments: 2,
        lastVisit: new Date(2025, 4, 15),
        status: 'active',
        photos: ['/api/placeholder/150/150'],
        createdAt: new Date(2024, 8, 1)
      },
      {
        _id: '2',
        profile: {
          name: 'Whiskers',
          species: 'Cat',
          breed: 'Persian',
          gender: 'Female',
          dateOfBirth: new Date(2019, 8, 22),
          weight: 12,
          color: 'White',
          microchipId: 'MC987654321',
          notes: 'Indoor cat, very calm and loves to sleep.',
        },
        owner: {
          _id: 'c2',
          profile: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
        },
        medicalHistory: [
          { date: new Date(2025, 3, 20), type: 'Grooming', description: 'Full grooming service' }
        ],
        upcomingAppointments: 1,
        lastVisit: new Date(2025, 3, 20),
        status: 'active',
        photos: ['/api/placeholder/150/150'],
        createdAt: new Date(2024, 10, 15)
      },
      {
        _id: '3',
        profile: {
          name: 'Max',
          species: 'Dog',
          breed: 'German Shepherd',
          gender: 'Male',
          dateOfBirth: new Date(2018, 5, 10),
          weight: 85,
          color: 'Black and Tan',
          microchipId: 'MC456789123',
          notes: 'Guard dog, needs experienced handling.',
        },
        owner: {
          _id: 'c1',
          profile: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
        },
        medicalHistory: [
          { date: new Date(2025, 1, 5), type: 'Surgery', description: 'Minor dental work' }
        ],
        upcomingAppointments: 0,
        lastVisit: new Date(2025, 1, 5),
        status: 'active',
        photos: ['/api/placeholder/150/150'],
        createdAt: new Date(2024, 7, 20)
      }
    ];
    
    setTimeout(() => {
      setPets(mockPets);
      setLoading(false);
    }, 1000);
  }, []);

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getSpeciesIcon = (species) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return '🐕';
      case 'cat':
        return '🐱';
      case 'bird':
        return '🐦';
      case 'rabbit':
        return '🐰';
      default:
        return '🐾';
    }
  };

  const filteredPets = pets.filter(pet => {
    if (filters.search && !pet.profile.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !pet.profile.breed.toLowerCase().includes(filters.search.toLowerCase()) &&
        !`${pet.owner.profile.firstName} ${pet.owner.profile.lastName}`.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.species !== 'all' && pet.profile.species.toLowerCase() !== filters.species.toLowerCase()) {
      return false;
    }
    if (filters.status !== 'all' && pet.status !== filters.status) {
      return false;
    }
    return true;
  });

  const speciesStats = pets.reduce((acc, pet) => {
    acc[pet.profile.species] = (acc[pet.profile.species] || 0) + 1;
    return acc;
  }, {});

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
          <h1 className="text-2xl font-bold text-gray-900">Pets</h1>
          <p className="text-gray-600">Manage pet profiles and medical records</p>
        </div>
        {user?.role !== 'pet_owner' && (
          <button className="btn-primary flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Pet
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <HeartIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Pets</p>
              <p className="text-2xl font-bold text-gray-900">{pets.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <span className="text-2xl">🐕</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Dogs</p>
              <p className="text-2xl font-bold text-gray-900">{speciesStats.Dog || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <span className="text-2xl">🐱</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Cats</p>
              <p className="text-2xl font-bold text-gray-900">{speciesStats.Cat || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <CalendarIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming Visits</p>
              <p className="text-2xl font-bold text-gray-900">
                {pets.reduce((sum, pet) => sum + pet.upcomingAppointments, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pets by name, breed, or owner..."
                className="input-field pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              className="input-field"
              value={filters.species}
              onChange={(e) => setFilters({ ...filters, species: e.target.value })}
            >
              <option value="all">All Species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="bird">Birds</option>
              <option value="rabbit">Rabbits</option>
            </select>
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pets Grid */}
      {filteredPets.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.species !== 'all' || filters.status !== 'all' 
                ? 'Try adjusting your search criteria.' 
                : 'Get started by adding your first pet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPets.map((pet) => (
            <div key={pet._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-2xl">
                        {getSpeciesIcon(pet.profile.species)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">
                      {pet.profile.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {pet.profile.breed} • {pet.profile.gender}
                    </p>
                    <p className="text-sm text-gray-500">
                      {calculateAge(pet.profile.dateOfBirth)} years old
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button className="p-1 text-blue-600 hover:text-blue-900">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-yellow-600 hover:text-yellow-900">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {user?.role !== 'pet_owner' && (
                    <button className="p-1 text-red-600 hover:text-red-900">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <UserIcon className="h-4 w-4 mr-1" />
                  <span>Owner: {pet.owner.profile.firstName} {pet.owner.profile.lastName}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <div className="font-medium text-gray-900">{pet.profile.weight} lbs</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Color:</span>
                    <div className="font-medium text-gray-900">{pet.profile.color}</div>
                  </div>
                </div>
              </div>

              {pet.profile.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {pet.profile.notes}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Upcoming:</span>
                    <div className="font-medium text-gray-900">{pet.upcomingAppointments} visits</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Visit:</span>
                    <div className="font-medium text-gray-900">
                      {pet.lastVisit.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 btn-secondary text-sm py-2">
                  View Profile
                </button>
                <button className="btn-primary text-sm py-2 px-4">
                  Book Visit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PetList;