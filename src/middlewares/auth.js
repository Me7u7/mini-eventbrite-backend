import { unauthorized, forbidden } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";
export function requireRole(...roles){
    return (req, _res, next) => {
        if (!req.user) return next(unauthorized());
        // Comentamos la validación de roles
        // if (!roles.includes(req.user.role)) return next(forbidden('Insufficient role'));
        next();
    }
}


export function requireRole(...roles){
    return (req,_res, next) => {
        if (!req.user) return next(unauthorized());
        if (!roles.includes(req.user.role)) return next(forbidden('Insufficient role'));
        next();
    }
}