const logger = require('../utils/logger');

// Middleware de manejo de errores global
const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error('Error en la aplicación', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous'
  });

  // Determinar código de estado
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Error interno del servidor';

  // Errores de validación
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Errores de base de datos
  if (err.code === '23505') { // Unique violation
    statusCode = 409;
    message = 'El recurso ya existe';
  }

  if (err.code === '23503') { // Foreign key violation
    statusCode = 400;
    message = 'Referencia inválida';
  }

  // Respuesta de error
  const response = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  };

  res.status(statusCode).json(response);
};

// Wrapper para async functions
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  asyncHandler
};

