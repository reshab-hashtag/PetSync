const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  constructor() {
    this.logFile = path.join(logsDir, 'app.log');
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    // Console output
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);

    // File output
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }

  info(message, meta) {
    this.log('info', message, meta);
  }

  error(message, meta) {
    this.log('error', message, meta);
  }

  warn(message, meta) {
    this.log('warn', message, meta);
  }

  debug(message, meta) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }

  // Stream for Morgan
  get stream() {
    return {
      write: (message) => {
        this.info(message.trim());
      }
    };
  }
}

module.exports = new Logger();