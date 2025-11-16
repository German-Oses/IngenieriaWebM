const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuración optimizada del pool de conexiones
const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  // Pool configuration para mejor escalabilidad
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Máximo de conexiones
  min: parseInt(process.env.DB_POOL_MIN || '5'),  // Mínimo de conexiones
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'), // 30s
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000'), // 2s
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

const pool = new Pool(config);

// Manejo de errores del pool
pool.on('error', (err) => {
  logger.error('Error inesperado en el pool de base de datos', err);
});

pool.on('connect', () => {
  logger.debug('Nueva conexión a la base de datos establecida');
});

// Wrapper mejorado para queries con logging y manejo de errores
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log queries lentas (más de 1 segundo)
    if (duration > 1000) {
      logger.warn('Query lenta detectada', {
        duration: `${duration}ms`,
        query: text.substring(0, 100)
      });
    }
    
    logger.debug('Query ejecutada', {
      duration: `${duration}ms`,
      rows: res.rowCount
    });
    
    return res;
  } catch (err) {
    const duration = Date.now() - start;
    logger.error('Error en query de base de datos', {
      error: err.message,
      duration: `${duration}ms`,
      query: text.substring(0, 100)
    });
    throw err;
  }
};

// Función para obtener una conexión del pool (para transacciones)
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Timeout para prevenir conexiones colgadas
  const timeout = setTimeout(() => {
    logger.error('Cliente de base de datos no liberado después de 10 segundos');
  }, 10000);
  
  client.release = () => {
    clearTimeout(timeout);
    return release();
  };
  
  return client;
};

module.exports = {
  query,
  pool,
  getClient
};
