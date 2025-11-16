// Sistema de logging robusto
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');
const INFO_LOG = path.join(LOG_DIR, 'info.log');

// Crear directorio de logs si no existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const formatDate = () => {
  return new Date().toISOString();
};

const writeLog = (file, level, message, data = null) => {
  const timestamp = formatDate();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data: typeof data === 'object' ? JSON.stringify(data) : data })
  };
  
  const logLine = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
  
  try {
    fs.appendFileSync(file, logLine);
  } catch (err) {
    console.error('Error escribiendo log:', err);
  }
};

const logger = {
  error: (message, error = null) => {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...(error.code && { code: error.code })
    } : null;
    
    writeLog(ERROR_LOG, 'ERROR', message, errorData);
    console.error(`[ERROR] ${message}`, error || '');
  },
  
  info: (message, data = null) => {
    writeLog(INFO_LOG, 'INFO', message, data);
    console.log(`[INFO] ${message}`, data || '');
  },
  
  warn: (message, data = null) => {
    writeLog(ERROR_LOG, 'WARN', message, data);
    console.warn(`[WARN] ${message}`, data || '');
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      writeLog(INFO_LOG, 'DEBUG', message, data);
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
};

module.exports = logger;

