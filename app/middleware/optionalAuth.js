const jwt = require('jsonwebtoken');

/**
 * Optional Authentication Middleware
 * - If token is provided and valid → Attach user to req.user
 * - If token is not provided → Continue without user (guest)
 * - If token is invalid → Return error
 */
const optionalAuth = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        // If no token provided, continue as guest
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null; // Guest user
            req.isAuthenticated = false;
            return next();
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = decoded;
        req.isAuthenticated = true;

        next();

    } catch (error) {
        // If token is invalid, return error
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

module.exports = optionalAuth;