// Import Express to create the web server
const express = require("express");
const pool = require("./config/dbConnection");
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
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/employee", require("./routes/employeeRoutes"));

const initializeDatabase = async () => {
    try {
        console.log("🔄 Initializing database...");

        // Create employees table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'staff', 'intern') DEFAULT 'staff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create employee_data table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                phone VARCHAR(20),
                age INT,
                employee_id INT NOT NULL,
                CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            )
        `);

        console.log("✅ Database initialized successfully!");
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        process.exit(1); // Stop execution if database setup fails
    }
};
// Start the server only if not in test mode
if (process.env.NODE_ENV !== "test") {
    initializeDatabase().then(() => {
        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });
    });
}

// Export the app instance for testing purposes
module.exports = app;
