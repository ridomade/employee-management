const express = require("express");
const tokenHandler = require("../middleware/tokenHandler");
const router = express.Router();

const {
    addEmployeeData,
    editEmployeeData,
    getEmployeeData,
    getAllEmployees,
    deleteEmployeeData,
} = require("../controllers/employeeControllers");

router.use(tokenHandler);

/**
 * @desc    Add employee data (Accessible to authenticated users)
 * @route   POST /api/employees/add
 * @access  Private (Authenticated users: Staff & Admin)
 */
router.post("/add", addEmployeeData);

/**
 * @desc    Edit employee data (Only the employee themselves or admins)
 * @route   PUT /api/employees/edit/:id
 * @access  Private (Employee themselves or Admin)
 */
router.put("/edit/:id", editEmployeeData);

/**
 * @desc    Get employee data by ID (Only the employee themselves)
 * @route   GET /api/employees/:id
 * @access  Private (Employee themselves or Admin)
 */
router.get("/:id", getEmployeeData);

/**
 * @desc    Get all employees (Admin only)
 * @route   GET /api/employees
 * @access  Private (Admin only)
 */
router.get("/", getAllEmployees);

/**
 * @desc    Delete employee data (Admin only)
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin only)
 */
router.delete("/:id", deleteEmployeeData);

module.exports = router;
