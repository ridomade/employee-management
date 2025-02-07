const express = require("express");
const tokenHandler = require("../middleware/tokenHandler"); // Middleware to validate JWT tokens
const router = express.Router();

const {
    registerNewEmployee,
    loginEmployee,
    deleteEmployeeAccount,
    validateToken,
} = require("../controllers/authController");

/**
 * @desc    Register a new employee (Only accessible by admins)
 * @route   POST /api/users/register
 * @access  Private (Admin only)
 */
router.post("/register", tokenHandler, registerNewEmployee);

/**
 * @desc    Employee login (Accessible to all users)
 * @route   POST /api/users/login
 * @access  Public
 */
router.post("/login", loginEmployee);

/**
 * @desc    Delete an employee account (Only accessible by admins)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
router.delete("/:id", tokenHandler, deleteEmployeeAccount);

/**
 * @desc    Validate JWT token (Accessible to authenticated users)
 * @route   GET /api/users/validate
 * @access  Private (Authenticated users)
 */
router.get("/validate", tokenHandler, validateToken);

module.exports = router;
