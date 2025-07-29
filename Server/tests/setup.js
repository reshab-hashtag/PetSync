const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Set environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-minimum-32-characters';
process.env.JWT_EXPIRES_IN = '7d';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Mock SMTP environment variables to prevent nodemailer initialization errors
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'testpassword';
process.env.FROM_EMAIL = 'noreply@petsync.com';
process.env.FROM_NAME = 'PetSync Test';

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect mongoose to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clean up between tests
beforeEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
};

module.exports = {
  mongoServer
};

// ----------------------------------------------------------------
// server/tests/__mocks__/nodemailer.js
module.exports = {
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'mock-message-id',
      accepted: ['test@example.com'],
      rejected: []
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn()
  }))
};

// ----------------------------------------------------------------
// server/tests/__mocks__/bcryptjs.js
module.exports = {
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
  hashSync: jest.fn().mockReturnValue('hashed-password-sync'),
  compareSync: jest.fn().mockReturnValue(true)
};

// ----------------------------------------------------------------
// server/tests/__mocks__/jsonwebtoken.js
module.exports = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'mock-user-id', role: 'test-role' }),
  decode: jest.fn().mockReturnValue({ userId: 'mock-user-id', role: 'test-role' }),
};

// ----------------------------------------------------------------
// server/tests/__mocks__/crypto.js
module.exports = {
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-random-token-123456789abcdef')
  }),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-hash')
  }),
  createCipher: jest.fn(),
  createDecipher: jest.fn()
};

// ----------------------------------------------------------------
// server/tests/__mocks__/fs.js
module.exports = {
  existsSync: jest.fn().mockReturnValue(false),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('mock-file-content'),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({
    isFile: jest.fn().mockReturnValue(true),
    size: 1024
  }),
  promises: {
    unlink: jest.fn().mockResolvedValue(),
    readFile: jest.fn().mockResolvedValue('mock-file-content'),
    writeFile: jest.fn().mockResolvedValue(),
    mkdir: jest.fn().mockResolvedValue(),
    stat: jest.fn().mockResolvedValue({
      isFile: jest.fn().mockReturnValue(true),
      size: 1024
    })
  }
};