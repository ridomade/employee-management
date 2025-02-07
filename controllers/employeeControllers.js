// Import database connection, password hashing, and JWT authentication
const pool = require("../config/dbConnection");
const bcrypt = require("bcrypt");

/**
 * @desc    Add new employee data (Only accessible to authenticated users)
 * @route   POST /api/users/add
 * @access  Private (Authenticated Users: Staff & Admin)
 */
const addEmployeeData = async (req, res) => {
    const { name, phone, age } = req.body;

    try {
        // Ensure the `employee_data` table exists (will only be created if it doesn't exist)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                age INT NOT NULL,
                employee_id INT NOT NULL,
                CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            )
        `);

        // Validate required fields
        const missingFields = [];
        if (!name) missingFields.push("name");
        if (!phone) missingFields.push("phone");
        if (!age) missingFields.push("age");

        if (missingFields.length > 0) {
            return res.status(400).json({ message: "All fields must be filled", missingFields });
        }

        // Insert employee data into the database
        await pool.query(
            "INSERT INTO employee_data (name, phone, age, employee_id) VALUES (?, ?, ?, ?)",
            [name, phone, age, req.user.id]
        );

        res.status(201).json({
            message: "Employee data successfully added",
            name,
            phone,
            age,
            employeeData: req.user,
        });
    } catch (error) {
        console.error("Error adding employee data:", error);
        res.status(500).json({ error: "Failed to add employee data" });
    }
};

/**
 * @desc    Edit employee data (Only the employee themselves or admins)
 * @route   PUT /api/users/edit/:id
 * @access  Private (Employee themselves or Admin)
 */
const editEmployeeData = async (req, res) => {
    const { name, phone, age, email, password } = req.body;
    const { id } = req.params;

    try {
        // Check if employee data exists
        const [employeeData] = await pool.query(
            "SELECT * FROM employee_data WHERE employee_id = ?",
            [id]
        );

        if (employeeData.length === 0) {
            return res.status(404).json({ message: "Employee data not found" });
        }

        // Ensure the user is updating their own data or is an admin
        if (id != req.user.id) {
            return res.status(403).json({ message: "You are not authorized to update this data" });
        }

        // Store the fields to be updated
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

        // Execute update if there are changes
        if (updates.length > 0) {
            values.push(id);
            const query = `UPDATE employee_data SET ${updates.join(", ")} WHERE employee_id = ?`;
            await pool.query(query, values);
        }

        // Updating email and password in the `employees` table
        const updates2 = [];
        const values2 = [];

        if (email) {
            updates2.push("email = ?");
            values2.push(email);
        }
        if (password) {
            updates2.push("password = ?");
            const hashedPassword = await bcrypt.hash(password, 10);
            values2.push(hashedPassword);
        }

        // Execute update for email/password if there are changes
        if (updates2.length > 0) {
            values2.push(id);
            const query2 = `UPDATE employees SET ${updates2.join(", ")} WHERE id = ?`;
            await pool.query(query2, values2);
        }

        // If no data was updated, return an error response
        if (updates.length === 0 && updates2.length === 0) {
            return res.status(400).json({ message: "No data provided for update" });
        }

        res.status(200).json({
            message: "Employee data successfully updated",
            updatedFields: { name, phone, age, email },
        });
    } catch (error) {
        console.error("Error updating employee data:", error);
        res.status(500).json({ error: "Failed to update employee data" });
    }
};

// Export functions for use in routes
module.exports = {
    addEmployeeData,
    editEmployeeData,
};
