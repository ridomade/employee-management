// Import necessary modules
const request = require("supertest"); // Library for making HTTP requests to test API endpoints
const app = require("../server"); // Import the Express application
const pool = require("../config/dbConnection"); // Import the database connection
const bcrypt = require("bcrypt"); // Library for hashing passwords securely
const jwt = require("jsonwebtoken"); // Library for generating and verifying JSON Web Tokens
require("dotenv").config(); // Load environment variables from the .env file

// Global variables for storing server instance and tokens
let server;
let adminToken; // Token for admin user to access protected routes
let staffToken; // Token for staff user
let testEmployeeId; // Variable to store the ID of a test employee for deletion tests

// Setup before running all test cases
beforeAll(async () => {
    // Start the server on port 4000
    server = app.listen(4000);

    // Clean the employees table before inserting new test data
    await pool.query("DELETE FROM employees");

    // Hash passwords for admin and staff users
    const adminPassword = await bcrypt.hash("adminpassword", 10);
    const staffPassword = await bcrypt.hash("staffpassword", 10);

    // Insert an admin user into the database
    const [adminResult] = await pool.query(
        "INSERT INTO employees (email, password, role) VALUES (?, ?, ?)",
        ["admin@example.com", adminPassword, "admin"]
    );
    const adminId = adminResult.insertId;

    // Generate a JWT token for the admin user
    adminToken = jwt.sign(
        { id: adminId, email: "admin@example.com", role: "admin" },
        process.env.PRIVATE_KEY, // Secret key from environment variables
        { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Insert a staff user into the database
    const [staffResult] = await pool.query(
        "INSERT INTO employees (email, password, role) VALUES (?, ?, ?)",
        ["staff@example.com", staffPassword, "staff"]
    );
    testEmployeeId = staffResult.insertId; // Store the staff user's ID for testing

    // Generate a JWT token for the staff user
    staffToken = jwt.sign(
        { id: testEmployeeId, email: "staff@example.com", role: "staff" },
        process.env.PRIVATE_KEY,
        { expiresIn: "1h" }
    );
});

// Cleanup after all tests are completed
afterAll(async () => {
    await pool.end(); // Close the database connection
    server.close(); // Stop the server
});

// Test suite for Authentication System
describe("Employee Registration", () => {
    // Test Case: Only admin can register new employees
    it("should register a new employee", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ email: "newuser@example.com", password: "newpassword", role: "staff" });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("message", "Employee successfully registered");
    });

    // Test Case: Reject Registration with Missing Fields
    it("should reject registration if required fields are missing", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ email: "", password: "" });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("message", "Email, role, and password are required");
    });

    // Test Case: Reject Registration with Invalid Role
    it("should reject registration if role is invalid", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ email: "invalidrole@example.com", password: "password", role: "invalid" });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty(
            "message",
            "Invalid role. Must be 'admin', 'staff', or 'intern'"
        );
    });

    // Test Case: Prevent Duplicate Email Registration
    it("should not allow duplicate email registration", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ email: "newuser@example.com", password: "newpassword", role: "staff" });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("message", "Email is already registered");
    });
});

describe("Employee Login", () => {
    // Test Case: Login with Valid Credentials
    it("should return a token for valid credentials", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ email: "staff@example.com", password: "staffpassword" });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body.employee.email).toBe("staff@example.com");
    });

    // Test Case: Reject Login with Missing Fields
    it("should return 400 if email or password is missing", async () => {
        const response = await request(app).post("/api/auth/login").send({ email: "" });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("message", "Email and password are required");
    });

    // Test Case: Reject Login with Invalid Credentials
    it("should return 401 for user not found", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ email: "wrong@example.com", password: "wrongpassword" });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("message", "User not found");
    });

    // Test Case: Reject Login with Invalid Credentials
    it("should return 401 for invalid credential", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ email: "staff@example.com", password: "wrongpassword" });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("message", "Invalid email or password");
    });
});

describe("Validate Token", () => {
    // Test Case: Validate Correct Token
    it("should validate a correct token", async () => {
        const response = await request(app)
            .get("/api/auth/validate")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message", "Token is valid");
    });

    // Test Case: Reject Invalid Token
    it("should reject an invalid token", async () => {
        const response = await request(app)
            .get("/api/auth/validate")
            .set("Authorization", "Bearer invalidtoken");

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("message", "Not authorized, invalid token");
    });

    // Test Case: Reject Missing Token
    it("should reject missing token", async () => {
        const response = await request(app).get("/api/auth/validate");

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("message", "Not authorized, no token provided");
    });
});

describe("Delete Employee Account", () => {
    // Test Case: Delete an Employee Account
    it("should delete an employee account if admin", async () => {
        const response = await request(app)
            .delete(`/api/auth/${testEmployeeId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message", "Employee deleted successfully");
    });

    // Test Case: Prevent Staff from Deleting an Account
    it("should not allow a staff user to delete an account", async () => {
        const response = await request(app)
            .delete(`/api/auth/${testEmployeeId}`)
            .set("Authorization", `Bearer ${staffToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty(
            "message",
            "Unauthorized: Only admins can delete employees"
        );
    });

    // Test Case: Reject Deleting a Non-Existing User
    it("should return 404 when deleting a non-existing user", async () => {
        const response = await request(app)
            .delete("/api/auth/99999") // Non-existent user ID
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("message", "Employee data not found");
    });
});
