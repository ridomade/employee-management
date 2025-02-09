const express = require("express");
const tokenHandler = require("../middleware/tokenHandler");
const router = express.Router();

const {
    registerNewEmployee,
    loginEmployee,
    deleteEmployeeAccount,
    validateToken,
} = require("../controllers/authController");

/**
 * @desc    Register a new employee (Admin only)
 * @route   POST /api/auth/register
 * @access  Private (Admin only)
 */
router.post("/register", tokenHandler, registerNewEmployee);

/**
 * @desc    Employee login (Accessible to all users)
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post("/login", loginEmployee);

/**
 * @desc    Delete an employee account (Admin only)
 * @route   DELETE /api/auth/:id
 * @access  Private (Admin only)
 */
router.delete("/:id", tokenHandler, deleteEmployeeAccount);

/**
 * @desc    Validate JWT token (Accessible to authenticated users)
 * @route   GET /api/auth/validate
 * @access  Private (Authenticated users)
 */
router.get("/validate", tokenHandler, validateToken);

module.exports = router;
