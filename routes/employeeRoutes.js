// Import Express to create a router
const express = require("express");
const tokenHandler = require("../middleware/tokenHandler"); // Middleware for authentication
const router = express.Router();

const { addEmployeeData, editEmployeeData } = require("../controllers/employeeControllers");

// Apply tokenHandler middleware to all routes in this router
router.use(tokenHandler);

/**
 * @desc    Add employee data (Accessible to authenticated users)
 * @route   POST /api/users/add
 * @access  Private (Authenticated users: Staff & Admin)
 */
router.post("/add", addEmployeeData);

/**
 * @desc    Edit employee data (Only the employee themselves or admins)
 * @route   PUT /api/users/edit/:id
 * @access  Private (Employee themselves or Admin)
 */
router.put("/edit/:id", editEmployeeData);

// Export the router for use in the main server file
module.exports = router;
