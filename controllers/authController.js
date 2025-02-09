const pool = require("../config/dbConnection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * @desc    Register a new employee (Admin only)
 * @route   POST /api/auth/register
 * @access  Private (Admin only)
 */
const registerNewEmployee = async (req, res) => {
    const { role, email, password } = req.body;

    try {
        // Ensure only admins can register new employees
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Unauthorized: Only admins can register new employees" });
        }

        // Validate required fields
        if (!email || !role || !password) {
            return res.status(400).json({ message: "Email, role, and password are required" });
        }

        if (!["admin", "staff", "intern"].includes(role)) {
            return res
                .status(400)
                .json({ message: "Invalid role. Must be 'admin', 'staff', or 'intern'" });
        }

        // Check if the email already exists
        const [[existingUser]] = await pool.query("SELECT id FROM employees WHERE email = ?", [
            email,
        ]);
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new employee and retrieve insertId
        const [result] = await pool.query(
            "INSERT INTO employees (role, email, password) VALUES (?, ?, ?)",
            [role, email, hashedPassword]
        );

        // Create an entry in employee_data
        await pool.query("INSERT INTO employee_data (employee_id) VALUES (?)", [result.insertId]);

        res.status(201).json({
            message: "Employee successfully registered",
            employeeId: result.insertId,
            email,
            role,
        });
    } catch (error) {
        console.error("Error registering employee:", error);
        res.status(500).json({ error: "Failed to register employee" });
    }
};

/**
 * @desc    Employee login (Accessible to all users)
 * @route   POST /api/auth/login
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
            return res.status(401).json({ message: "User not found" });
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
 * @desc    Validate JWT token (Accessible to authenticated users)
 * @route   GET /api/auth/validate
 * @access  Private (Authenticated users)
 */
const validateToken = async (req, res) => {
    res.json({ message: "Token is valid", user: req.user });
};

/**
 * @desc    Delete an employee account (Admin only)
 * @route   DELETE /api/auth/:id
 * @access  Private (Admin only)
 */
const deleteEmployeeAccount = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Unauthorized: Only admins can delete employees" });
        }

        // Ensure the employee exists before deleting
        const [employee] = await pool.query("SELECT * FROM employees WHERE id = ?", [id]);
        if (employee.length === 0) {
            return res.status(404).json({ message: "Employee data not found" });
        }

        // Delete the employee from both tables
        await pool.query("DELETE FROM employee_data WHERE employee_id = ?", [id]);
        const [result] = await pool.query("DELETE FROM employees WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Employee data not found" });
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee:", error);
        res.status(500).json({ error: "Failed to delete employee" });
    }
};
module.exports = {
    registerNewEmployee,
    loginEmployee,
    deleteEmployeeAccount,
    validateToken,
};
