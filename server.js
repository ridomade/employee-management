// Import Express to create the web server
const express = require("express");

// Load environment variables from .env file
require("dotenv").config();

// Import CORS (Cross-Origin Resource Sharing) to manage API access
const cors = require("cors");

// Create an instance of the Express application
const app = express();

// Enable CORS for all domains (you can restrict it to specific domains if needed)
app.use(
    cors({
        origin: "*", // Allow all domains (replace with specific origins if needed)
        methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
        allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers in requests
    })
);

// Middleware to parse incoming JSON requests
app.use(express.json());

// Define the port number from environment variables or use 5000 as a default
const port = process.env.PORT || 5000;

// Import and use authentication and employee management routes
app.use("/api/users", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/employeeRoutes"));

// Start the server only if not in test mode (to avoid unnecessary execution during testing)
if (process.env.NODE_ENV !== "test") {
    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
}

// Export the app instance for testing purposes
module.exports = app;
