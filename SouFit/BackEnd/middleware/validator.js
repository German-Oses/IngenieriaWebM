
const { check, validationResult } = require('express-validator');
 

exports.registerRules = () => [
    check('username', 'El nombre de usuario es obligatorio').not().isEmpty(),
    check('email', 'Por favor, incluye un email válido').isEmail(),
    check('password', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 }),
];

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array().map(err => err.msg) });
    }
    next();
};
