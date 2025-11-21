// Rate limiting simple (sin dependencia externa por ahora)
const rateLimitMap = new Map();

const rateLimit = (windowMs, max) => {
    return (req, res, next) => {
        // No aplicar rate limiting a peticiones OPTIONS (preflight CORS)
        if (req.method === 'OPTIONS') {
            return next();
        }
        
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!rateLimitMap.has(key)) {
            rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const record = rateLimitMap.get(key);
        
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
            return next();
        }
        
        if (record.count >= max) {
            const remainingTime = Math.ceil((record.resetTime - now) / 1000 / 60);
            return res.status(429).json({ 
                error: 'Demasiadas solicitudes, intenta de nuevo más tarde',
                message: `Has excedido el límite de solicitudes. Por favor, espera ${remainingTime} minuto(s) antes de intentar nuevamente.`,
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
        }
        
        record.count++;
        next();
    };
};

// Rate limiting para autenticación (más permisivo para permitir múltiples intentos de login)
const authLimiter =
    process.env.NODE_ENV === "production"
        ? rateLimit(15 * 60 * 1000, 200)  // 200 requests cada 15 minutos (más permisivo para login)
        : rateLimit(60 * 1000, 1000);     // desarrollo: 1000 requests por minuto  


// Rate limiting general (más permisivo en desarrollo)
const generalLimiter = 
    process.env.NODE_ENV === "production"
        ? rateLimit(15 * 60 * 1000, 100)  // producción: 100 requests cada 15 minutos
        : rateLimit(60 * 1000, 1000);    // desarrollo: 1000 requests por minuto

// Sanitización de entrada (protección XSS)
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remover tags HTML peligrosos
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        } else if (Array.isArray(obj)) {
            return obj.map(sanitize);
        } else if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitize(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };
    
    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    if (req.params) {
        req.params = sanitize(req.params);
    }
    
    next();
};

// Headers de seguridad
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
};

module.exports = {
    authLimiter,
    generalLimiter,
    sanitizeInput,
    securityHeaders,
};

