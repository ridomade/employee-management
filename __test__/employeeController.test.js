// Import necessary modules
const request = require("supertest"); // Used for making HTTP requests to test the API
const app = require("../server"); // Import the Express application
const pool = require("../config/dbConnection"); // Import the database connection
const bcrypt = require("bcrypt"); // Used for hashing passwords
const jwt = require("jsonwebtoken"); // Used for generating and verifying JSON Web Tokens
require("dotenv").config(); // Load environment variables from the .env file

// Global variables to store server instance and tokens
let server;
let adminToken;
let staffToken;
let testEmployeeId;

// Setup before running all tests
beforeAll(async () => {
    // Start the server on port 4000
    server = app.listen(4000);

    // Clean the database before inserting test data
    await pool.query("DELETE FROM employee_data");
    await pool.query("DELETE FROM employees");

    // Hash passwords for admin and staff users
    const adminPassword = await bcrypt.hash("adminpassword", 10);
    const staffPassword = await bcrypt.hash("staffpassword", 10);
    const internPassword = await bcrypt.hash("internpassword", 10);

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

    await pool.query("INSERT INTO employee_data (employee_id) VALUES (?)", [testEmployeeId]);

    // Insert a staff user into the database
    const [internResult] = await pool.query(
        "INSERT INTO employees (email, password, role) VALUES (?, ?, ?)",
        ["intern@example.com", internPassword, "intern"]
    );
    internId = internResult.insertId; // Store the staff user's ID for testing

    await pool.query("INSERT INTO employee_data (employee_id) VALUES (?)", [internId]);

    // Generate a JWT token for the staff user
    staffToken = jwt.sign(
        { id: testEmployeeId, email: "staff@example.com", role: "staff" },
        process.env.PRIVATE_KEY,
        { expiresIn: "1h" }
    );
});

// Cleanup after all tests are finished
afterAll(async () => {
    // Clean the database before inserting test data
    await pool.query("DELETE FROM employee_data");
    await pool.query("DELETE FROM employees");
    await pool.end(); // Close the database connection
    server.close(); // Stop the server
});

// Test for adding employee data
describe("Add Employee Data Test", () => {
    // Test Case: Succesfully Add Employee Data
    it("should successfully add employee data", async () => {
        const response = await request(app)
            .post("/api/employee/add")
            .set("Authorization", `Bearer ${staffToken}`)
            .send({ name: "John Doe", phone: "123456789", age: 30 });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("message", "Employee data successfully added");
        expect(response.body).toHaveProperty("name", "John Doe");
        expect(response.body).toHaveProperty("phone", "123456789");
        expect(response.body).toHaveProperty("age", 30);
    });

    // Test Case: Reject Adding Employee Data with Missing Fields
    it("should reject adding employee data with missing fields", async () => {
        const response = await request(app)
            .post("/api/employee/add")
            .set("Authorization", `Bearer ${staffToken}`)
            .send({ name: "", phone: "", age: "" });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty(
            "message",
            "All fields are required (name, phone, age)"
        );
    });
});

// Test for getting employee data by ID
describe("Get Employee Data Test", () => {
    // Test Case: Successfully Get Employee Data
    it("should successfully get employee data by ID", async () => {
        const response = await request(app)
            .get(`/api/employee/${testEmployeeId}`)
            .set("Authorization", `Bearer ${staffToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message", "Employee data retrieved successfully");
        expect(response.body.data[0]).toHaveProperty("name", "John Doe");
        expect(response.body.data[0]).toHaveProperty("phone", "123456789");
        expect(response.body.data[0]).toHaveProperty("age", 30);
    });

    // Test Case: Reject Getting Non-Existing Employee Data
    it("should reject getting non-existing employee data", async () => {
        const response = await request(app)
            .get("/api/employee/99999")
            .set("Authorization", `Bearer ${staffToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("message", "Employee data not found");
    });
    // Test Case : Rejecting Unauthorized Access
    it("should reject unauthorized access to employee data", async () => {
        const response = await request(app)
            .get(`/api/employee/${internId}`)
            .set("Authorization", `Bearer ${staffToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty("message", "Unauthorized access");
    });
});

// Test for getting all employees data
describe("Get All Employees Test", () => {
    // Test Case : Successfully Get All Employees
    it("should successfully get all employees data", async () => {
        const response = await request(app)
            .get("/api/employee")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message", "All employees retrieved successfully");
        expect(response.body.data).toHaveLength(3);
    });

    // Test Case : Rejecting Unauthorized Access
    it("should reject unauthorized access to all employees data", async () => {
        const response = await request(app)
            .get("/api/employee")
            .set("Authorization", `Bearer ${staffToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty("message", "Unauthorized access");
    });
});

// Test for updating employee data
describe("Update Employee Data Test", () => {
    // Test Case : Successfully Update Employee Data
    it("should successfully update employee data", async () => {
        const response = await request(app)
            .put(`/api/employee/update/${testEmployeeId}`)
            .set("Authorization", `Bearer ${staffToken}`)
            .send({ name: "Jane Doe", phone: "987654321", age: 25 });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message", "Employee data updated successfully");
    });

    // Test Case : Rejecting Unauthorized Access
    it("should reject unauthorized access to update employee data", async () => {
        const response = await request(app)
            .put(`/api/employee/update/${internId}`)
            .set("Authorization", `Bearer ${staffToken}`)
            .send({ name: "Jane Doe", phone: "987654321", age: 25 });

        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty("message", "Unauthorized access");
    });
});

// Test for deleting employee data
describe("Delete Employee Data Test", () => {
    // Test Case : Successfully Delete Employee Data
    it("should successfully delete employee data", async () => {
        const response = await request(app)
            .delete(`/api/employee/delete/${testEmployeeId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message", "Employee data deleted successfully");
    });

    // Test Case : Rejecting Unauthorized Access
    it("should reject unauthorized access to delete employee data", async () => {
        const response = await request(app)
            .delete(`/api/employee/delete/${internId}`)
            .set("Authorization", `Bearer ${staffToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty("message", "Unauthorized access");
    });

    // Test Case : Rejecting Non-Existing Employee Data
    it("should reject deleting non-existing employee data", async () => {
        const response = await request(app)
            .delete("/api/employee/delete/99999")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("message", "Employee data not found");
    });
});
