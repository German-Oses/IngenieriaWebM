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
    
    return nodemailer.createTransport({
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
  }
  
  // PRIORIDAD 2: Gmail (requiere contraseña de aplicación) - RECOMENDADO
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    logger.info('✅ Usando Gmail para envío de correos', { 
      user: process.env.GMAIL_USER 
    });
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
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

// Template HTML para el correo de recuperación
const getRecoveryEmailTemplate = (nombreUsuario, nombre, codigo) => {
  // URL del logo - usar FRONTEND_URL de Render o default de Vercel
  const logoUrl = process.env.FRONTEND_URL 
    ? `${process.env.FRONTEND_URL}/assets/icon/SouFitLogo.png`
    : 'https://soufit.vercel.app/assets/icon/SouFitLogo.png';
  
  // URL del frontend para links en el email
  const frontendUrl = process.env.FRONTEND_URL || 'https://soufit.vercel.app';
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña - SouFit</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #3880ff 0%, #3171e0 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background-color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .logo img {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333333;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .greeting strong {
            color: #3880ff;
        }
        .message {
            font-size: 16px;
            color: #666666;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        .code-container {
            background-color: #f8f9fa;
            border: 2px dashed #3880ff;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .code {
            font-size: 36px;
            font-weight: 700;
            color: #3880ff;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .warning-text {
            font-size: 14px;
            color: #856404;
            line-height: 1.6;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .footer-text {
            font-size: 14px;
            color: #999999;
            line-height: 1.6;
        }
        .footer-link {
            color: #3880ff;
            text-decoration: none;
        }
        .button {
            display: inline-block;
            background-color: #3880ff;
            color: #ffffff;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">
                <img src="${logoUrl}" alt="SouFit Logo" />
            </div>
            <h1>SouFit</h1>
        </div>
        
        <div class="email-body">
            <div class="greeting">
                Hola <strong>${nombre || nombreUsuario}</strong>,
            </div>
            
            <div class="message">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>SouFit</strong>.
                Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.
            </div>
            
            <div class="code-container">
                <div class="code-label">Tu código de recuperación es:</div>
                <div class="code">${codigo}</div>
            </div>
            
            <div class="warning">
                <div class="warning-text">
                    <strong>⚠️ Importante:</strong> Este código es válido por <strong>15 minutos</strong> y solo puede ser usado una vez. 
                    No compartas este código con nadie.
                </div>
            </div>
            
            <div class="message">
                Ingresa este código en la aplicación para restablecer tu contraseña. 
                Si tienes problemas, contacta a nuestro equipo de soporte.
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Este es un correo automático, por favor no respondas.<br>
                Si tienes dudas, visita <a href="${frontendUrl}" class="footer-link">SouFit</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};


// Función para enviar correo con retry (usando nodemailer como fallback)
const sendEmailWithRetry = async (transporter, mailOptions, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info('Correo enviado exitosamente', {
        messageId: info.messageId,
        to: mailOptions.to,
        attempt
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.warn(`Intento ${attempt}/${maxRetries} falló al enviar correo`, {
        error: error.message,
        to: mailOptions.to
      });
      
      if (attempt === maxRetries) {
        logger.error('Todos los intentos de envío de correo fallaron', error);
        return { success: false, error: error.message };
      }
      
      // Esperar antes de reintentar (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Template HTML para el correo de verificación de email
const getVerificationEmailTemplate = (nombreUsuario, nombre, codigo) => {
  const logoUrl = process.env.FRONTEND_URL 
    ? `${process.env.FRONTEND_URL}/assets/icon/SouFitLogo.png`
    : 'https://soufit.vercel.app/assets/icon/SouFitLogo.png';
  
  const frontendUrl = process.env.FRONTEND_URL || 'https://soufit.vercel.app';
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica tu Email - SouFit</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #3880ff 0%, #3171e0 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background-color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .logo img {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333333;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .greeting strong {
            color: #3880ff;
        }
        .message {
            font-size: 16px;
            color: #666666;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        .code-container {
            background-color: #f8f9fa;
            border: 2px dashed #3880ff;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .code {
            font-size: 36px;
            font-weight: 700;
            color: #3880ff;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .info {
            background-color: #e3f2fd;
            border-left: 4px solid #3880ff;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .info-text {
            font-size: 14px;
            color: #1976d2;
            line-height: 1.6;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .footer-text {
            font-size: 14px;
            color: #999999;
            line-height: 1.6;
        }
        .footer-link {
            color: #3880ff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">
                <img src="${logoUrl}" alt="SouFit Logo" />
            </div>
            <h1>SouFit</h1>
        </div>
        
        <div class="email-body">
            <div class="greeting">
                ¡Bienvenido <strong>${nombre || nombreUsuario}</strong>!
            </div>
            
            <div class="message">
                Gracias por registrarte en <strong>SouFit</strong>. Para completar tu registro y activar tu cuenta, 
                necesitamos verificar tu dirección de correo electrónico.
            </div>
            
            <div class="code-container">
                <div class="code-label">Tu código de verificación es:</div>
                <div class="code">${codigo}</div>
            </div>
            
            <div class="info">
                <div class="info-text">
                    <strong>ℹ️ Información:</strong> Este código es válido por <strong>24 horas</strong>. 
                    Ingresa este código en la aplicación para verificar tu email y activar tu cuenta.
                </div>
            </div>
            
            <div class="message">
                Si no solicitaste este código, puedes ignorar este correo de forma segura.
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Este es un correo automático, por favor no respondas.<br>
                Si tienes dudas, visita <a href="${frontendUrl}" class="footer-link">SouFit</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

// Función para enviar correo de verificación de email
const sendVerificationEmail = async (email, nombreUsuario, nombre, codigo) => {
  try {
    logger.info('Iniciando envío de correo de verificación', { email, nombreUsuario });
    
    // Determinar el email "from" según el servicio configurado
    let fromEmail = process.env.EMAIL_FROM;
    
    // Si usa MailerSend, puede usar el dominio de prueba sin verificar
    if (process.env.MAILERSEND_API_TOKEN) {
      fromEmail = process.env.EMAIL_FROM || process.env.MAILERSEND_FROM_EMAIL || 'MS_xxxxx@trial-xxxxx.mlsender.net';
      logger.info('Configurando envío con MailerSend', { 
        fromEmail,
        hasToken: !!process.env.MAILERSEND_API_TOKEN
      });
    } else {
      fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@soufit.com';
      logger.info('Configurando envío de correo de verificación', { 
        fromEmail,
        hasGmail: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
        hasSmtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
      });
    }
    
    const subject = '✅ Verifica tu Email - SouFit';
    const html = getVerificationEmailTemplate(nombreUsuario, nombre, codigo);
    const text = `¡Bienvenido ${nombre || nombreUsuario}!\n\nTu código de verificación de email es: ${codigo}\n\nEste código es válido por 24 horas.\n\nIngresa este código en la aplicación para verificar tu email y activar tu cuenta.\n\nSaludos,\nEl equipo de SouFit`;
    
    // Usar nodemailer con el transporter configurado
    const transporter = createTransporter();
    if (!transporter) {
      logger.error('❌ No se ha configurado el servicio de correo. Verifica las variables de entorno MAILERSEND_API_TOKEN, GMAIL_USER/GMAIL_APP_PASSWORD o SMTP_HOST/SMTP_USER/SMTP_PASS.');
      logger.error('Variables de entorno disponibles:', {
        hasMailerSend: !!process.env.MAILERSEND_API_TOKEN,
        hasEmailFrom: !!process.env.EMAIL_FROM,
        hasSmtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
        hasGmail: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
      });
      return false;
    }
    
    logger.info('Enviando correo de verificación con nodemailer', { from: fromEmail, to: email });
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: subject,
      html: html,
      text: text
    };
    
    const result = await sendEmailWithRetry(transporter, mailOptions);
    if (result.success) {
      logger.info('✅ Correo de verificación enviado exitosamente', { messageId: result.messageId });
    } else {
      logger.error('❌ Falló el envío del correo de verificación', { error: result.error });
    }
    return result.success;
  } catch (error) {
    logger.error('Error crítico al enviar correo de verificación', {
      error: error.message,
      stack: error.stack,
      email
    });
    return false;
  }
};

// Exportar función de verificación
exports.sendVerificationEmail = sendVerificationEmail;

// Función para enviar correo de recuperación
exports.sendRecoveryEmail = async (email, nombreUsuario, nombre, codigo) => {
  try {
    logger.info('Iniciando envío de correo de recuperación', { email, nombreUsuario });
    
    // Determinar el email "from" según el servicio configurado
    let fromEmail = process.env.EMAIL_FROM;
    
    // Si usa MailerSend, puede usar el dominio de prueba sin verificar
    if (process.env.MAILERSEND_API_TOKEN) {
      fromEmail = process.env.EMAIL_FROM || process.env.MAILERSEND_FROM_EMAIL || 'MS_xxxxx@trial-xxxxx.mlsender.net';
      logger.info('Configurando envío de recuperación con MailerSend', { 
        fromEmail,
        hasToken: !!process.env.MAILERSEND_API_TOKEN
      });
    } else {
      fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@soufit.com';
      logger.info('Configurando envío de correo de recuperación', { 
        fromEmail,
        hasGmail: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
        hasSmtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
      });
    }
    
    const subject = '🔐 Recuperación de Contraseña - SouFit';
    const html = getRecoveryEmailTemplate(nombreUsuario, nombre, codigo);
    const text = `Hola ${nombre || nombreUsuario},\n\nTu código de recuperación de contraseña es: ${codigo}\n\nEste código es válido por 15 minutos.\n\nSi no solicitaste este código, ignora este correo.\n\nSaludos,\nEl equipo de SouFit`;
    
    // Usar nodemailer con el transporter configurado
    const transporter = createTransporter();
    if (!transporter) {
      logger.error('❌ No se ha configurado el servicio de correo para recuperación. Verifica las variables de entorno MAILERSEND_API_TOKEN, GMAIL_USER/GMAIL_APP_PASSWORD o SMTP_HOST/SMTP_USER/SMTP_PASS.');
      logger.error('Variables de entorno disponibles:', {
        hasMailerSend: !!process.env.MAILERSEND_API_TOKEN,
        hasEmailFrom: !!process.env.EMAIL_FROM,
        hasSmtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
        hasGmail: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
      });
      return false;
    }
    
    logger.info('Enviando correo de recuperación con nodemailer', { from: fromEmail, to: email });
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: subject,
      html: html,
      text: text
    };
    
    const result = await sendEmailWithRetry(transporter, mailOptions);
    if (result.success) {
      logger.info('✅ Correo de recuperación enviado exitosamente', { messageId: result.messageId });
    } else {
      logger.error('❌ Error al enviar correo de recuperación', { error: result.error });
    }
    return result.success;
  } catch (error) {
    logger.error('Error crítico al enviar correo de recuperación', {
      error: error.message,
      stack: error.stack,
      email
    });
    return false;
  }
};

