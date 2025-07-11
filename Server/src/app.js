const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');


// import models 
require('./models/Business');
require('./models/User');
require('./models/Pet');
require('./models/Appointment');
require('./models/Invoice');
require('./models/Message');
require('./models/Service');
require('./models/Document');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logging');

// Import routes
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/business');
const appointmentRoutes = require('./routes/appointments');
const petRoutes = require('./routes/pets');
const staffRoutes = require('./routes/staff');
// const invoiceRoutes = require('./routes/invoices');
// const messageRoutes = require('./routes/messages');
// const documentRoutes = require('./routes/documents');
const clientRoutes = require('./routes/Client');
const serviceRoutes =require('./routes/services')
const businessCategoryRoutes = require('./routes/businessCategory');
const dashboardRoutes = require('./routes/dashboard');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/admin');
const otpRoutes = require('./routes/otp')
// const paymentRoutes = require('./routes/payments');

// Import socket handlers
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
// app.use(cors({origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'], credentials: true}));
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Security middleware
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
// }));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// CORS configuration
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// API routes


app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/pets', petRoutes);
// app.use('/api/invoices', invoiceRoutes);
// app.use('/api/messages', messageRoutes);
// app.use('/api/documents', documentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/business-categories', businessCategoryRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/otp', otpRoutes);
// app.use('/api/payments', paymentRoutes);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// catch-all 404 handler — no path string, so no path-to-regexp parsing
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


// Socket.io setup
socketHandler(io);

// Error handling middleware (should be last)
app.use(errorHandler);

module.exports = { app, server };