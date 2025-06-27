# PetSync CRM Backend

A comprehensive CRM system for pet businesses including grooming, veterinary, daycare, and training services.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control
- 📅 **Appointment Management**: Complete scheduling system with conflicts detection
- 🐕 **Pet Profiles**: Comprehensive pet information with medical records
- 💳 **Payment Processing**: Stripe and PayPal integration
- 📧 **Communication**: Email, SMS, and real-time messaging
- 📊 **Analytics**: Business metrics and reporting
- 🔍 **Audit Logging**: Complete activity tracking
- 📱 **Real-time Updates**: Socket.IO for live notifications

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- Redis (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd petsync-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Seed the database:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Using Docker

1. Start with Docker Compose:
```bash
docker-compose up -d
```

2. Seed the database:
```bash
docker-compose exec backend npm run seed
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Appointment Endpoints
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get appointments (with filters)
- `GET /api/appointments/:id` - Get specific appointment
- `PUT /api/appointments/:id` - Update appointment
- `POST /api/appointments/:id/cancel` - Cancel appointment
- `POST /api/appointments/:id/checkin` - Check-in pet
- `POST /api/appointments/:id/start` - Start service
- `POST /api/appointments/:id/complete` - Complete service

### Pet Endpoints
- `POST /api/pets` - Create pet profile
- `GET /api/pets` - Get pets (with filters)
- `GET /api/pets/:id` - Get specific pet
- `PUT /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet
- `POST /api/pets/:id/medical` - Add medical record

## Default Login Credentials

After running the seed script:

- **Super Admin**: admin@petsync.com / Admin123!
- **Business Admin**: john@happypaws.com / Owner123!
- **Staff**: jane@happypaws.com / Staff123!
- **Pet Owner**: alice@example.com / Client123!

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic services
├── socket/         # Socket.IO handlers
└── utils/          # Utility functions
```

## Environment Variables

Key environment variables (see .env.example for complete list):

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `SMTP_*` - Email configuration
- `TWILIO_*` - SMS configuration
- `STRIPE_*` - Payment processing
- `FRONTEND_URLS` - Allowed frontend origins

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Production Environment

1. Set NODE_ENV to 'production'
2. Use a strong JWT_SECRET
3. Configure proper email/SMS services
4. Set up SSL/TLS
5. Configure MongoDB with authentication
6. Set up proper logging and monitoring

### Security Considerations

- Rate limiting is enabled
- CORS is configured
- Helmet.js provides security headers
- JWT tokens have expiration
- Passwords are bcrypt hashed
- Input validation on all endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.