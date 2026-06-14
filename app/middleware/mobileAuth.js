const jwt = require("jsonwebtoken");
const User = require("../models/appUser");

const JwtDecode = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Token missing",
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

module.exports = JwtDecode; // ✅ IMPORTANT
