const Pet = require('../models/Pet');

// Calculate pet age
exports.calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const ageInMilliseconds = today - birthDate;
  const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
  
  return Math.floor(ageInYears);
};

// Get pets with upcoming appointments
exports.getPetsWithUpcomingAppointments = async (businessId) => {
  try {
    const pets = await Pet.aggregate([
      { $match: { business: businessId, status: 'active' } },
      {
        $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'pet',
          as: 'appointments'
        }
      },
      {
        $addFields: {
          upcomingAppointments: {
            $size: {
              $filter: {
                input: '$appointments',
                cond: { 
                  $and: [
                    { $gte: ['$$this.schedule.date', new Date()] },
                    { $eq: ['$$this.status', 'scheduled'] }
                  ]
                }
              }
            }
          }
        }
      },
      { $match: { upcomingAppointments: { $gt: 0 } } },
      { $sort: { upcomingAppointments: -1 } }
    ]);

    return pets;
  } catch (error) {
    console.error('Error getting pets with upcoming appointments:', error);
    return [];
  }
};

// Get pet statistics for dashboard
exports.getPetDashboardStats = async (businessId) => {
  try {
    const stats = await Pet.aggregate([
      { $match: { business: businessId } },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalPets: { $sum: 1 },
                activePets: {
                  $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                avgAge: {
                  $avg: {
                    $cond: [
                      { $ne: ['$profile.dateOfBirth', null] },
                      {
                        $divide: [
                          { $subtract: [new Date(), '$profile.dateOfBirth'] },
                          365.25 * 24 * 60 * 60 * 1000
                        ]
                      },
                      null
                    ]
                  }
                }
              }
            }
          ],
          speciesBreakdown: [
            {
              $group: {
                _id: '$profile.species',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          recentlyAdded: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                'profile.name': 1,
                'profile.species': 1,
                'profile.breed': 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ]);

    return stats[0];
  } catch (error) {
    console.error('Error getting pet dashboard stats:', error);
    return null;
  }
};

// Validate microchip ID format
exports.validateMicrochipId = (microchipId) => {
  if (!microchipId) return true; // Optional field
  
  // Common microchip formats
  const patterns = [
    /^\d{15}$/, // 15 digits
    /^\d{10}$/, // 10 digits
    /^[A-Z0-9]{10,15}$/ // Alphanumeric 10-15 chars
  ];
  
  return patterns.some(pattern => pattern.test(microchipId));
};

// Generate pet profile summary
exports.generatePetSummary = (pet) => {
  const age = exports.calculateAge(pet.profile.dateOfBirth);
  const ageStr = age ? `${age} year${age !== 1 ? 's' : ''} old` : 'Age unknown';
  
  return {
    id: pet._id,
    name: pet.profile.name,
    species: pet.profile.species,
    breed: pet.profile.breed,
    age: ageStr,
    owner: pet.owner?.profile ? 
      `${pet.owner.profile.firstName} ${pet.owner.profile.lastName}` : 
      'Unknown owner',
    lastVisit: pet.lastVisit,
    status: pet.status,
    hasAllergies: pet.medicalHistory?.allergies?.length > 0,
    hasMedications: pet.medicalHistory?.medications?.length > 0,
    totalVisits: pet.totalVisits || 0
  };
};

module.exports = exports;