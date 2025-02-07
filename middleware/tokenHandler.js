// Import JWT library for token verification
const jwt = require("jsonwebtoken");

// Load environment variables from .env file
require("dotenv").config();

/**
 * @desc    Middleware to validate JWT authentication tokens
 * @access  Private (Used to protect routes that require authentication)
 */
const tokenHandler = (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization || req.headers.Authorization;

        // Check if Authorization header is provided and correctly formatted
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized, no token provided" });
        }

        // Extract the token from the header
        token = authHeader.split(" ")[1];

        // Validate token format (JWT should have exactly 3 parts separated by dots)
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
            return res.status(401).json({ message: "Not authorized, invalid token" });
        }

        // Regular expression to ensure token consists of valid characters
        const jwtRegex = /^[A-Za-z0-9-_]+$/;
        if (
            !jwtRegex.test(tokenParts[0]) ||
            !jwtRegex.test(tokenParts[1]) ||
            !jwtRegex.test(tokenParts[2])
        ) {
            return res.status(401).json({ message: "Not authorized, invalid token" });
        }

        // Verify the token using the private key
        const decoded = jwt.verify(token, process.env.PRIVATE_KEY);
        if (!decoded || !decoded.id || !decoded.role) {
            return res.status(401).json({ message: "Unauthorized: Invalid token data" });
        }

        // Attach user data to the request object for further use in route handlers
        req.user = decoded;
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ message: "Not authorized, invalid token" });
    }
};

// Export the middleware for use in protected routes
module.exports = tokenHandler;
