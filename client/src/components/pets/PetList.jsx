// PetList.jsx - Updated with Add Pet Modal
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
  XMarkIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import AddPetModal from './AddPetModal';
import { getPets, deletePet } from '../../store/slices/petSlice';
import { getClients } from '../../store/slices/clientSlice';
import toast from 'react-hot-toast';

const PetList = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { pets, isLoading } = useSelector((state) => state.pets);
  const { clients } = useSelector((state) => state.client);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    species: 'all',
    status: 'all',
  });

  useEffect(() => {
    dispatch(getPets());
    dispatch(getClients());
  }, [dispatch]);

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
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

  const handleDeletePet = async (petId) => {
    if (window.confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      try {
        await dispatch(deletePet(petId)).unwrap();
        toast.success('Pet deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to delete pet');
      }
    }
  };

  const handleEditPet = (pet) => {
    setSelectedPet(pet);
    setShowEditModal(true);
  };

  const handleAddPetSuccess = () => {
    setShowAddModal(false);
    dispatch(getPets()); // Refresh pets list
  };

  const handleEditPetSuccess = () => {
    setShowEditModal(false);
    setSelectedPet(null);
    dispatch(getPets()); // Refresh pets list
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


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pets</h1>
            <p className="text-gray-600">Manage pet profiles and medical records</p>
          </div>
          {user?.role !== 'pet_owner' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
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
                <p className="text-2xl font-bold text-gray-900">{speciesStats.dog || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{speciesStats.cat || 0}</p>
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
                  {pets.reduce((sum, pet) => sum + (pet.upcomingAppointments || 0), 0)}
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
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {filters.search || filters.species !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by adding your first pet.'}
              </p>
              {(!filters.search && filters.species === 'all' && filters.status === 'all') && user?.role !== 'pet_owner' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary flex items-center mx-auto"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Your First Pet
                </button>
              )}
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
                    <button
                      onClick={() => handleEditPet(pet)}
                      className="p-1 text-yellow-600 hover:text-yellow-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {user?.role !== 'pet_owner' && (
                      <button
                        onClick={() => handleDeletePet(pet._id)}
                        className="p-1 text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>Owner: {pet.owner?.profile?.firstName} {pet.owner?.profile?.lastName}</span>
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
                      <div className="font-medium text-gray-900">{pet.upcomingAppointments || 0} visits</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Visit:</span>
                      <div className="font-medium text-gray-900">
                        {pet.lastVisit ? new Date(pet.lastVisit).toLocaleDateString() : 'No visits'}
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

      {/* Add Pet Modal */}
      <AddPetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddPetSuccess}
        clients={clients}
      />

      {/* Edit Pet Modal */}
      {selectedPet && (
        <AddPetModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditPetSuccess}
          clients={clients}
          editPet={selectedPet}
        />
      )}
    </div>
  );
};

export default PetList;