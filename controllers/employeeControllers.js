const pool = require("../config/dbConnection");
const bcrypt = require("bcrypt");

/**
 * @desc    Add new employee data
 * @route   POST /api/employees/add
 * @access  Private (Authenticated Users: Staff & Admin)
 */
const addEmployeeData = async (req, res) => {
    const { name, phone, age } = req.body;

    try {
        if (!name || !phone || !age) {
            return res.status(400).json({ message: "All fields are required (name, phone, age)" });
        }

        await pool.query(
            "UPDATE employee_data SET name = ?, phone = ?, age = ? WHERE employee_id = ?",
            [name, phone, age, req.user.id]
        );

        res.status(201).json({ message: "Employee data successfully added", name, phone, age });
    } catch (error) {
        console.error("Error adding employee data:", error);
        res.status(500).json({ error: "Failed to add employee data" });
    }
};

/**
 * @desc    Get employee data by ID
 * @route   GET /api/employees/:id
 * @access  Private (Employee themselves or Admin)
 */
const getEmployeeData = async (req, res) => {
    const { id } = req.params;

    try {
        const [employeeData] = await pool.query(
            `SELECT e.email, ed.* 
             FROM employees e
             JOIN employee_data ed ON e.id = ed.employee_id
             WHERE e.id = ?`,
            [id]
        );

        if (!employeeData.length) {
            return res.status(404).json({ message: "Employee data not found" });
        }

        if (req.user.id != id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        res.status(200).json({
            message: "Employee data retrieved successfully",
            data: employeeData,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to get employee data" });
    }
};

/**
 * @desc    Get all employees (Admin only)
 * @route   GET /api/employees
 * @access  Private (Admin only)
 */
const getAllEmployees = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const [employees] = await pool.query(
            `SELECT e.id, e.email, e.role, ed.name, ed.phone, ed.age 
             FROM employees e 
             LEFT JOIN employee_data ed ON e.id = ed.employee_id`
        );

        res.status(200).json({ message: "All employees retrieved successfully", data: employees });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve employees" });
    }
};

/**
 * @desc    Edit employee data
 * @route   PUT /api/employees/edit/:id
 * @access  Private (Employee themselves or Admin)
 */
const editEmployeeData = async (req, res) => {
    const { name, phone, age, email, password } = req.body;
    const { id } = req.params;

    try {
        if (req.user.id != id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push("name = ?");
            values.push(name);
        }
        if (phone) {
            updates.push("phone = ?");
            values.push(phone);
        }
        if (age) {
            updates.push("age = ?");
            values.push(age);
        }
        if (email) {
            updates.push("email = ?");
            values.push(email);
        }
        if (password) {
            updates.push("password = ?");
            values.push(await bcrypt.hash(password, 10));
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No data provided for update" });
        }

        values.push(id);
        await pool.query(
            `UPDATE employee_data SET ${updates.join(", ")} WHERE employee_id = ?`,
            values
        );

        res.status(200).json({ message: "Employee data updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update employee data" });
    }
};

/**
 * @desc    Delete employee data (Admin only)
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin only)
 */
const deleteEmployeeData = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const [result] = await pool.query("DELETE FROM employees WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Employee data not found" });
        }

        res.json({ message: "Employee data deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete employee data" });
    }
};

module.exports = {
    addEmployeeData,
    editEmployeeData,
    getEmployeeData,
    getAllEmployees,
    deleteEmployeeData,
};
