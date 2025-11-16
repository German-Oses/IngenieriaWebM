
const { check, validationResult } = require('express-validator');
 

exports.registerRules = () => [
    check('username', 'El nombre de usuario es obligatorio')
        .not().isEmpty()
        .trim()
        .isLength({ min: 3, max: 20 }).withMessage('El nombre de usuario debe tener entre 3 y 20 caracteres')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'),
    check('nombre', 'El nombre es obligatorio')
        .not().isEmpty()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
    check('apellido', 'El apellido es obligatorio')
        .not().isEmpty()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El apellido solo puede contener letras y espacios'),
    check('email', 'Por favor, incluye un email válido')
        .isEmail()
        .normalizeEmail()
        .isLength({ max: 100 }).withMessage('El email no puede exceder 100 caracteres'),
    check('password', 'La contraseña debe tener 6 o más caracteres')
        .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener entre 6 y 100 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'),
    check('fecha_nacimiento', 'La fecha de nacimiento es obligatoria')
        .not().isEmpty()
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Formato de fecha inválido. Use YYYY-MM-DD'),
    check('id_region', 'La región es obligatoria')
        .not().isEmpty()
        .isInt({ min: 1 }).withMessage('Debes seleccionar una región válida'),
    check('id_comuna', 'La comuna es obligatoria')
        .not().isEmpty()
        .isInt({ min: 1 }).withMessage('Debes seleccionar una comuna válida'),
];

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array().map(err => err.msg) });
    }
    next();
};
