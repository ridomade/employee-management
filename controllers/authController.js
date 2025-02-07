// Import required modules
const pool = require("../config/dbConnection"); // Database connection
const bcrypt = require("bcrypt"); // Password hashing library
const jwt = require("jsonwebtoken"); // Token generation library

/**
 * @desc    Register a new employee (Only accessible by admins)
 * @route   POST /api/users/register
 * @access  Private (Admin only)
 */
const registerNewEmployee = async (req, res) => {
    const { role, email, password } = req.body;

    try {
        // Get the role of the currently authenticated user
        const [roleData] = await pool.query("SELECT role FROM employees WHERE id = ?", [
            req.user.id,
        ]);
        const userRole = roleData[0].role;

        // Ensure only admins can register new employees
        if (userRole !== "admin") {
            return res
                .status(403)
                .json({ message: "You are not authorized to perform this action" });
        }

        // Create the employees table if it does not exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'staff', 'intern') DEFAULT 'staff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Validate required fields
        if (!email || !role || !password) {
            return res.status(400).json({ message: "All fields must be filled" });
        }

        // Check if the email already exists
        const [existingUser] = await pool.query("SELECT * FROM employees WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        // Validate role
        if (!["admin", "staff", "intern"].includes(role)) {
            return res.status(400).json({ message: "Role must be admin, staff, or intern" });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new employee data
        const [result] = await pool.query(
            "INSERT INTO employees (role, email, password) VALUES (?, ?, ?)",
            [role, email, hashedPassword]
        );

        res.status(201).json({
            message: "Employee successfully added",
            employeeId: result.insertId,
            email,
            role,
        });
    } catch (error) {
        console.error("Error adding employee:", error);
        res.status(500).json({ error: "Failed to add employee" });
    }
};

/**
 * @desc    Employee login (Accessible to all users)
 * @route   POST /api/users/login
 * @access  Public
 */
const loginEmployee = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find the employee by email
        const [user] = await pool.query("SELECT * FROM employees WHERE email = ?", [email]);

        if (user.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const employee = user[0];

        // Verify the password
        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: employee.id, email: employee.email, role: employee.role },
            process.env.PRIVATE_KEY,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful",
            employee: {
                id: employee.id,
                email: employee.email,
                role: employee.role,
            },
            token,
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "An error occurred during login" });
    }
};

/**
 * @desc    Delete an employee account (Only accessible by admins)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
const deleteEmployeeAccount = async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: Missing user data" });
        }

        // Get the role of the currently authenticated user
        const [roleData] = await pool.query("SELECT role FROM employees WHERE id = ?", [
            req.user.id,
        ]);

        if (!roleData.length) {
            return res.status(403).json({ message: "Unauthorized: User not found" });
        }

        const userRole = roleData[0].role;

        // Ensure only admins can delete employees
        if (userRole !== "admin") {
            return res
                .status(403)
                .json({ message: "You are not authorized to perform this action" });
        }

        // Delete the employee based on ID
        const [result] = await pool.query("DELETE FROM employees WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Employee data not found" });
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee data:", error);
        res.status(500).json({ error: "Failed to delete employee data" });
    }
};

/**
 * @desc    Validate JWT token (Accessible to authenticated users)
 * @route   GET /api/users/validate
 * @access  Private (Authenticated users)
 */
const validateToken = async (req, res) => {
    res.json({ message: "Token is valid" });
};

// Export functions to be used in routes
module.exports = {
    registerNewEmployee,
    loginEmployee,
    deleteEmployeeAccount,
    validateToken,
};
