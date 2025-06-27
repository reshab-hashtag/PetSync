const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');
const Business = require('../src/models/Business');
const Pet = require('../src/models/Pet');
const Service = require('../src/models/Service');
const { ROLES } = require('../src/config/constants');

const connectDB = require('../src/config/database');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Business.deleteMany({});
    await Pet.deleteMany({});
    await Service.deleteMany({});

    console.log('Creating super admin...');
    // Create super admin
    const superAdmin = new User({
      role: ROLES.SUPER_ADMIN,
      profile: {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@petsync.com',
        phone: '+1234567890'
      },
      auth: {
        passwordHash: 'Admin123!',
        emailVerified: true
      },
      permissions: []
    });

    await superAdmin.save();
    console.log('✓ Super admin created');

    console.log('Creating sample business...');
    // Create sample business
    const business = new Business({
      profile: {
        name: 'Happy Paws Grooming',
        description: 'Professional pet grooming services',
        email: 'info@happypaws.com',
        phone: '+1987654321',
        address: {
          street: '123 Pet Street',
          city: 'Pet City',
          state: 'CA',
          zipCode: '90210',
          country: 'US'
        }
      },
      services: [
        {
          name: 'Basic Grooming',
          description: 'Wash, dry, and basic trim',
          duration: 90,
          price: { amount: 50, currency: 'USD' },
          category: 'grooming'
        },
        {
          name: 'Premium Grooming',
          description: 'Full service grooming with nail trim',
          duration: 120,
          price: { amount: 75, currency: 'USD' },
          category: 'grooming'
        },
        {
          name: 'Bath & Brush',
          description: 'Basic bath and brushing service',
          duration: 60,
          price: { amount: 35, currency: 'USD' },
          category: 'grooming'
        }
      ],
      schedule: {
        timezone: 'America/Los_Angeles',
        workingHours: {
          monday: { isOpen: true, open: '09:00', close: '17:00' },
          tuesday: { isOpen: true, open: '09:00', close: '17:00' },
          wednesday: { isOpen: true, open: '09:00', close: '17:00' },
          thursday: { isOpen: true, open: '09:00', close: '17:00' },
          friday: { isOpen: true, open: '09:00', close: '17:00' },
          saturday: { isOpen: true, open: '10:00', close: '16:00' },
          sunday: { isOpen: false, open: '', close: '' }
        }
      }
    });

    await business.save();
    console.log('✓ Sample business created');

    console.log('Creating business admin...');
    // Create business admin
    const businessAdmin = new User({
      role: ROLES.BUSINESS_ADMIN,
      business: business._id,
      profile: {
        firstName: 'John',
        lastName: 'Owner',
        email: 'john@happypaws.com',
        phone: '+1555000001'
      },
      auth: {
        passwordHash: 'Owner123!',
        emailVerified: true
      },
      permissions: [
        { module: 'appointments', actions: ['read', 'write', 'delete'] },
        { module: 'clients', actions: ['read', 'write', 'delete'] },
        { module: 'billing', actions: ['read', 'write'] },
        { module: 'reports', actions: ['read'] },
        { module: 'staff', actions: ['read', 'write'] }
      ]
    });

    await businessAdmin.save();
    business.staff.push(businessAdmin._id);
    await business.save();
    console.log('✓ Business admin created');

    console.log('Creating staff member...');
    // Create staff member
    const staff = new User({
      role: ROLES.STAFF,
      business: business._id,
      profile: {
        firstName: 'Jane',
        lastName: 'Groomer',
        email: 'jane@happypaws.com',
        phone: '+1555000002'
      },
      auth: {
        passwordHash: 'Staff123!',
        emailVerified: true
      },
      permissions: [
        { module: 'appointments', actions: ['read', 'write'] },
        { module: 'clients', actions: ['read'] }
      ]
    });

    await staff.save();
    business.staff.push(staff._id);
    await business.save();
    console.log('✓ Staff member created');

    console.log('Creating sample pet owner...');
    // Create sample pet owner
    const petOwner = new User({
      role: ROLES.CLIENT,
      business: business._id,
      profile: {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '+1555000003',
        address: {
          street: '456 Owner Lane',
          city: 'Pet City',
          state: 'CA',
          zipCode: '90211'
        }
      },
      auth: {
        passwordHash: 'Client123!',
        emailVerified: true
      },
      settings: {
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      }
    });

    await petOwner.save();
    console.log('✓ Sample pet owner created');

    console.log('Creating sample pets...');
    // Create sample pets
    const pet1 = new Pet({
      owner: petOwner._id,
      profile: {
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        gender: 'male',
        color: 'Golden',
        birthDate: new Date('2020-05-15'),
        weight: { value: 65, unit: 'lbs' }
      },
      medical: {
        allergies: ['chicken'],
        vaccinations: [
          {
            vaccine: 'Rabies',
            administeredDate: new Date('2023-01-15'),
            expirationDate: new Date('2026-01-15'),
            veterinarian: 'Dr. Smith'
          }
        ]
      },
      behavior: {
        temperament: ['friendly', 'energetic'],
        likes: ['treats', 'walks'],
        dislikes: ['loud noises']
      }
    });

    const pet2 = new Pet({
      owner: petOwner._id,
      profile: {
        name: 'Whiskers',
        species: 'cat',
        breed: 'Persian',
        gender: 'female',
        color: 'White',
        birthDate: new Date('2019-08-20'),
        weight: { value: 12, unit: 'lbs' }
      },
      medical: {
        allergies: [],
        vaccinations: [
          {
            vaccine: 'FVRCP',
            administeredDate: new Date('2023-02-10'),
            expirationDate: new Date('2024-02-10'),
            veterinarian: 'Dr. Johnson'
          }
        ]
      },
      behavior: {
        temperament: ['calm', 'independent'],
        specialInstructions: 'Needs gentle handling'
      }
    });

    await pet1.save();
    await pet2.save();

    // Add pets to owner
    petOwner.pets.push(pet1._id, pet2._id);
    await petOwner.save();

    console.log('✓ Sample pets created');

    console.log('Creating additional sample data...');
    // Create another pet owner
    const petOwner2 = new User({
      role: ROLES.CLIENT,
      business: business._id,
      profile: {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        phone: '+1555000004'
      },
      auth: {
        passwordHash: 'Client123!',
        emailVerified: true
      }
    });

    await petOwner2.save();

    const pet3 = new Pet({
      owner: petOwner2._id,
      profile: {
        name: 'Rex',
        species: 'dog',
        breed: 'German Shepherd',
        gender: 'male',
        birthDate: new Date('2021-03-10'),
        weight: { value: 75, unit: 'lbs' }
      }
    });

    await pet3.save();
    petOwner2.pets.push(pet3._id);
    await petOwner2.save();

    console.log('\n🎉 Seeding completed successfully!\n');
    console.log('=== Default Login Credentials ===');
    console.log('Super Admin: admin@petsync.com / Admin123!');
    console.log('Business Admin: john@happypaws.com / Owner123!');
    console.log('Staff: jane@happypaws.com / Staff123!');
    console.log('Pet Owner 1: alice@example.com / Client123!');
    console.log('Pet Owner 2: bob@example.com / Client123!');
    console.log('\n=== Sample Data Created ===');
    console.log('• 1 Business: Happy Paws Grooming');
    console.log('• 3 Services: Basic Grooming, Premium Grooming, Bath & Brush');
    console.log('• 3 Pets: Buddy (Golden Retriever), Whiskers (Persian Cat), Rex (German Shepherd)');
    console.log('• 5 Users across all roles\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData };