const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configuración del transporter de nodemailer
// Prioridad: MailerSend > Gmail > SMTP Genérico
const createTransporter = () => {
  // PRIORIDAD 1: MailerSend (permite usar sin dominio - dominio de prueba)
  // MailerSend puede configurarse de dos formas:
  // 1. Solo con MAILERSEND_API_TOKEN (el sistema genera el username)
  // 2. Con MAILERSEND_SMTP_USER y MAILERSEND_SMTP_PASS explícitos
  if (process.env.MAILERSEND_API_TOKEN || (process.env.MAILERSEND_SMTP_USER && process.env.MAILERSEND_SMTP_PASS)) {
    let smtpUsername, smtpPassword;
    
    // Si se proporcionan username y password explícitos, usarlos
    if (process.env.MAILERSEND_SMTP_USER && process.env.MAILERSEND_SMTP_PASS) {
      smtpUsername = process.env.MAILERSEND_SMTP_USER;
      smtpPassword = process.env.MAILERSEND_SMTP_PASS;
      logger.info('✅ Usando MailerSend con credenciales SMTP explícitas', { 
        username: smtpUsername
      });
    } else if (process.env.MAILERSEND_API_TOKEN) {
      // Si solo se proporciona el token, extraer el username del token
      // El token tiene formato: mlsn.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      // El username para SMTP es: MS_ + primeros caracteres después de "mlsn."
      const tokenParts = process.env.MAILERSEND_API_TOKEN.split('.');
      
      if (tokenParts.length > 1 && tokenParts[1]) {
        // Tomar los primeros caracteres después de "mlsn." para formar MS_xxxxx
        smtpUsername = `MS_${tokenParts[1].substring(0, 10)}`;
      } else {
        // Fallback: intentar usar el token directamente si tiene formato MS_
        smtpUsername = process.env.MAILERSEND_API_TOKEN.startsWith('MS_') 
          ? process.env.MAILERSEND_API_TOKEN.split('_').slice(0, 2).join('_')
          : 'MS_user';
      }
      
      smtpPassword = process.env.MAILERSEND_API_TOKEN;
      logger.info('✅ Usando MailerSend con token API (username generado automáticamente)', { 
        username: smtpUsername
      });
    }
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailersend.com',
      port: 587,
      secure: false,
      auth: {
        user: smtpUsername,
        pass: smtpPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Verificar conexión (no bloqueante)
    transporter.verify().then(() => {
      logger.info('✅ Conexión SMTP de MailerSend verificada correctamente');
    }).catch((verifyError) => {
      logger.warn('⚠️ Advertencia al verificar conexión SMTP de MailerSend (continuará intentando enviar)', {
        error: verifyError.message,
        errorCode: verifyError.code
      });
    });
    
    return transporter;
  }
  
  // PRIORIDAD 2: Gmail (requiere contraseña de aplicación) - RECOMENDADO
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    logger.info('✅ Usando Gmail para envío de correos', { 
      user: process.env.GMAIL_USER 
    });
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    // Verificar conexión (no bloqueante)
    transporter.verify().then(() => {
      logger.info('✅ Conexión SMTP de Gmail verificada correctamente');
    }).catch((verifyError) => {
      logger.warn('⚠️ Advertencia al verificar conexión SMTP de Gmail (continuará intentando enviar)', {
        error: verifyError.message,
        errorCode: verifyError.code
      });
    });
    
    return transporter;
  }
  
  // PRIORIDAD 3: SMTP Genérico (cualquier proveedor SMTP)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    logger.info('✅ Usando SMTP genérico para envío de correos', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || '587'
    });
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Para desarrollo, en producción debería ser true
      }
    });
  }
  
  // Si no hay configuración, retornar null
  logger.error('❌ No se ha configurado el servicio de correo. Configura MAILERSEND_API_TOKEN, GMAIL_USER/GMAIL_APP_PASSWORD o SMTP_HOST/SMTP_USER/SMTP_PASS.');
  return null;
};

// Funciones de recuperación de contraseña eliminadas - no se implementarán por ahora


// Función para enviar correo con retry (usando nodemailer como fallback)
const sendEmailWithRetry = async (transporter, mailOptions, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Intento ${attempt}/${maxRetries} de envío de correo`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      const info = await transporter.sendMail(mailOptions);
      logger.info('✅ Correo enviado exitosamente', {
        messageId: info.messageId,
        to: mailOptions.to,
        from: mailOptions.from,
        attempt
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`❌ Intento ${attempt}/${maxRetries} falló al enviar correo`, {
        error: error.message,
        errorCode: error.code,
        errorResponse: error.response,
        errorResponseCode: error.responseCode,
        stack: error.stack,
        to: mailOptions.to,
        from: mailOptions.from
      });
      
      if (attempt === maxRetries) {
        logger.error('❌ Todos los intentos de envío de correo fallaron', {
          error: error.message,
          errorCode: error.code,
          errorResponse: error.response,
          to: mailOptions.to
        });
        return { success: false, error: error.message, errorCode: error.code };
      }
      
      // Esperar antes de reintentar (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Funciones de verificación de email y recuperación de contraseña eliminadas - no se implementarán por ahora

