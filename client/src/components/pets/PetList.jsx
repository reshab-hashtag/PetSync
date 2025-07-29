// PetList.jsx - Updated with Add Pet Modal
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import AddPetModal from './AddPetModal';
import { getPets, deletePet } from '../../store/slices/petSlice';
import { getClients } from '../../store/slices/clientSlice';
import toast from 'react-hot-toast';
import PetDetailsModal from './PetDetailsModal';
import ConfirmDialog from '../common/ConfirmDialog';

const PetList = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { pets, isLoading } = useSelector((state) => state.pets);
  const { clients } = useSelector((state) => state.client);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [petToDelete, setPetToDelete] = useState(null);
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

  const handleDeletePet = (petId) => {
    setPetToDelete(petId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deletePet(petToDelete)).unwrap();
      toast.success('Pet deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete pet');
    } finally {
      setShowDeleteDialog(false);
      setPetToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setPetToDelete(null);
  };

  const handleEditPet = (pet) => {
    setSelectedPet(pet);
    setShowEditModal(true);
  };

  const handleAddPetSuccess = () => {
    setShowAddModal(false);
    dispatch(getPets());
  };


  const handleViewProfile = (pet) => {
    setSelectedPet(pet);
    setShowDetailsModal(true);
  };

  const handleEditPetSuccess = () => {
    setShowEditModal(false);
    setSelectedPet(null);
    dispatch(getPets());
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPets.map((pet) => (
                <div key={pet._id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden">
                  {/* Header with Avatar and Actions */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-lg">
                              {getSpeciesIcon(pet.profile.species)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {pet.profile.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {pet.profile.breed}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => handleEditPet(pet)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="Edit Pet"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {user?.role !== 'pet_owner' && (
                          <button
                            onClick={() => handleDeletePet(pet._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Pet"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <UserIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {pet.owner?.profile?.firstName} {pet.owner?.profile?.lastName}
                      </span>
                    </div>

                    {/* Pet Details - Compact Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-gray-500 mb-1">Age</div>
                        <div className="font-medium text-gray-900">
                          {calculateAge(pet.profile.dateOfBirth)}y
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-gray-500 mb-1">Weight</div>
                        <div className="font-medium text-gray-900">
                          {pet.profile.weight} lbs
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-gray-500 mb-1">Gender</div>
                        <div className="font-medium text-gray-900 capitalize">
                          {pet.profile.gender}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-gray-500 mb-1">Color</div>
                        <div className="font-medium text-gray-900 truncate">
                          {pet.profile.color}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Action Button */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => handleViewProfile(pet)}
                      className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 px-3 rounded transition-colors"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Alternative: Even More Compact List View for Mobile */}
            <div className="block sm:hidden space-y-3">
              {filteredPets.map((pet) => (
                <div key={pet._id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">
                            {getSpeciesIcon(pet.profile.species)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {pet.profile.name}
                            </h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {calculateAge(pet.profile.dateOfBirth)}y
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-sm text-gray-500 truncate">
                              {pet.profile.breed}
                            </span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-500">
                              {pet.profile.weight} lbs
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-3">
                        <button
                          onClick={() => handleViewProfile(pet)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </button>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditPet(pet)}
                            className="p-1 text-gray-400 hover:text-yellow-600"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {user?.role !== 'pet_owner' && (
                            <button
                              onClick={() => handleDeletePet(pet._id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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




      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Pet"
          message="Are you sure you want to delete this pet? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* Pet Details Modal */}
      <PetDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        pet={selectedPet}
      />
    </div>
  );
};

export default PetList;