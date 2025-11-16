const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configuración del transporter de nodemailer
// Prioridad: Resend > SMTP > Gmail
const createTransporter = () => {
  // PRIORIDAD 1: Resend (Recomendado para producción)
  if (process.env.RESEND_API_KEY) {
    logger.info('Usando Resend para envío de correos');
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });
  }
  
  // PRIORIDAD 2: SMTP Genérico
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    logger.info('Usando SMTP genérico para envío de correos');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // PRIORIDAD 3: Gmail (requiere contraseña de aplicación)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    logger.info('Usando Gmail para envío de correos');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  
  // Para desarrollo: si no hay configuración, retornar null
  // El sistema mostrará el código en consola como fallback
  logger.warn('No se ha configurado el servicio de correo. El código se mostrará en consola.');
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

// Función para enviar correo de recuperación con retry
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
exports.sendVerificationEmail = async (email, nombreUsuario, nombre, codigo) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.error('No se ha configurado el servicio de correo. Verifica las variables de entorno RESEND_API_KEY, SMTP o GMAIL.');
      return false;
    }
    
    // Determinar el email "from" según el servicio configurado
    let fromEmail = process.env.EMAIL_FROM;
    
    // Si usa Resend, el EMAIL_FROM debe ser un dominio verificado en Resend
    if (process.env.RESEND_API_KEY) {
      fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    } else {
      fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@soufit.com';
    }
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: '✅ Verifica tu Email - SouFit',
      html: getVerificationEmailTemplate(nombreUsuario, nombre, codigo),
      text: `¡Bienvenido ${nombre || nombreUsuario}!\n\nTu código de verificación de email es: ${codigo}\n\nEste código es válido por 24 horas.\n\nIngresa este código en la aplicación para verificar tu email y activar tu cuenta.\n\nSaludos,\nEl equipo de SouFit`
    };
    
    const result = await sendEmailWithRetry(transporter, mailOptions);
    return result.success;
  } catch (error) {
    logger.error('Error crítico al enviar correo de verificación', error);
    return false;
  }
};

// Función para enviar correo de recuperación
exports.sendRecoveryEmail = async (email, nombreUsuario, nombre, codigo) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.error('No se ha configurado el servicio de correo. Verifica las variables de entorno RESEND_API_KEY, SMTP o GMAIL.');
      return false;
    }
    
    // Determinar el email "from" según el servicio configurado
    let fromEmail = process.env.EMAIL_FROM;
    
    // Si usa Resend, el EMAIL_FROM debe ser un dominio verificado en Resend
    if (process.env.RESEND_API_KEY) {
      fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    } else {
      fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@soufit.com';
    }
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: '🔐 Recuperación de Contraseña - SouFit',
      html: getRecoveryEmailTemplate(nombreUsuario, nombre, codigo),
      text: `Hola ${nombre || nombreUsuario},\n\nTu código de recuperación de contraseña es: ${codigo}\n\nEste código es válido por 15 minutos.\n\nSi no solicitaste este código, ignora este correo.\n\nSaludos,\nEl equipo de SouFit`
    };
    
    const result = await sendEmailWithRetry(transporter, mailOptions);
    return result.success;
  } catch (error) {
    logger.error('Error crítico al enviar correo de recuperación', error);
    return false;
  }
};

