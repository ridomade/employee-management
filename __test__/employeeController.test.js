// // Import necessary modules
// const request = require("supertest"); // Used for making HTTP requests to test the API
// const app = require("../server"); // Import the Express application
// const pool = require("../config/dbConnection"); // Import the database connection
// const bcrypt = require("bcrypt"); // Used for hashing passwords
// const jwt = require("jsonwebtoken"); // Used for generating and verifying JSON Web Tokens
// require("dotenv").config(); // Load environment variables from the .env file

// // Global variables to store server instance and tokens
// let server;
// let adminToken;
// let staffToken;
// let testEmployeeId;

// // Setup before running all tests
// beforeAll(async () => {
//     // Start the server on port 4000
//     server = app.listen(4000);

//     // Clean the database before inserting test data
//     await pool.query("DELETE FROM employee_data");
//     await pool.query("DELETE FROM employees");

//     // Hash passwords for admin and staff users
//     const adminPassword = await bcrypt.hash("adminpassword", 10);
//     const staffPassword = await bcrypt.hash("staffpassword", 10);

//     // Insert an admin user into the database
//     const [adminResult] = await pool.query(
//         "INSERT INTO employees (email, password, role) VALUES (?, ?, ?)",
//         ["admin@example.com", adminPassword, "admin"]
//     );
//     const adminId = adminResult.insertId;

//     // Generate a JWT token for the admin user
//     adminToken = jwt.sign(
//         { id: adminId, email: "admin@example.com", role: "admin" },
//         process.env.PRIVATE_KEY, // Secret key from environment variables
//         { expiresIn: "1h" } // Token expires in 1 hour
//     );

//     // Insert a staff user into the database
//     const [staffResult] = await pool.query(
//         "INSERT INTO employees (email, password, role) VALUES (?, ?, ?)",
//         ["staff@example.com", staffPassword, "staff"]
//     );
//     testEmployeeId = staffResult.insertId; // Store the staff user's ID for testing

//     // Generate a JWT token for the staff user
//     staffToken = jwt.sign(
//         { id: testEmployeeId, email: "staff@example.com", role: "staff" },
//         process.env.PRIVATE_KEY,
//         { expiresIn: "1h" }
//     );
// });

// // Cleanup after all tests are finished
// afterAll(async () => {
//     await pool.end(); // Close the database connection
//     server.close(); // Stop the server
// });

// // Test suite for Employee Data Management
// describe("Employee Data Management Tests", () => {
//     // **Test Case: Add Employee Data**
//     it("should successfully add employee data", async () => {
//         const response = await request(app)
//             .post("/api/users/add")
//             .set("Authorization", `Bearer ${staffToken}`) // Authenticate as a staff user
//             .send({ name: "John Doe", phone: "123456789", age: 30 });

//         // Expect successful response with the correct data
//         expect(response.statusCode).toBe(201);
//         expect(response.body).toHaveProperty("message", "Employee data successfully added");
//         expect(response.body).toHaveProperty("name", "John Doe");
//         expect(response.body).toHaveProperty("phone", "123456789");
//         expect(response.body).toHaveProperty("age", 30);
//     });

//     // **Test Case: Reject Adding Employee Data with Missing Fields**
//     it("should reject adding employee data with missing fields", async () => {
//         const response = await request(app)
//             .post("/api/users/add")
//             .set("Authorization", `Bearer ${staffToken}`)
//             .send({ name: "", phone: "", age: "" });

//         // Expect error response with missing fields
//         expect(response.statusCode).toBe(400);
//         expect(response.body).toHaveProperty("message", "All fields must be filled");
//         expect(response.body.missingFields).toContain("name");
//         expect(response.body.missingFields).toContain("phone");
//         expect(response.body.missingFields).toContain("age");
//     });

//     // **Test Case: Reject Adding Employee Data with Invalid Token**
//     it("should reject adding employee data with an invalid token", async () => {
//         const response = await request(app)
//             .post("/api/users/add")
//             .set("Authorization", "Bearer invalidtoken")
//             .send({ name: "Jane Doe", phone: "987654321", age: 28 });

//         // Expect authentication error response
//         expect(response.statusCode).toBe(401);
//         expect(response.body).toHaveProperty("message", "Not authorized, invalid token");
//     });

//     // **Test Case: Reject Adding Employee Data if No Token is Provided**
//     it("should reject adding employee data if no token is provided", async () => {
//         const response = await request(app)
//             .post("/api/users/add")
//             .send({ name: "Jane Doe", phone: "987654321", age: 28 });

//         // Expect authentication error response
//         expect(response.statusCode).toBe(401);
//         expect(response.body).toHaveProperty("message", "Not authorized, no token provided");
//     });

//     // **Test Case: Edit Employee Data**
//     it("should successfully edit employee data", async () => {
//         const response = await request(app)
//             .put(`/api/users/edit/${testEmployeeId}`)
//             .set("Authorization", `Bearer ${staffToken}`)
//             .send({ name: "John Smith", phone: "111222333", age: 35 });

//         // Expect successful response with updated fields
//         expect(response.statusCode).toBe(200);
//         expect(response.body).toHaveProperty("message", "Employee data successfully updated");
//         expect(response.body.updatedFields.name).toBe("John Smith");
//         expect(response.body.updatedFields.phone).toBe("111222333");
//         expect(response.body.updatedFields.age).toBe(35);
//     });

//     // **Test Case: Reject Editing Employee Data if No Changes are Provided**
//     it("should reject editing employee data if no changes are provided", async () => {
//         const response = await request(app)
//             .put(`/api/users/edit/${testEmployeeId}`)
//             .set("Authorization", `Bearer ${staffToken}`)
//             .send({});

//         // Expect error response due to missing update data
//         expect(response.statusCode).toBe(400);
//         expect(response.body).toHaveProperty("message", "No data provided for update");
//     });

//     // **Test Case: Reject Editing Non-Existing Employee Data**
//     it("should reject editing non-existing employee data", async () => {
//         const response = await request(app)
//             .put("/api/users/edit/99999")
//             .set("Authorization", `Bearer ${staffToken}`)
//             .send({ name: "New Name" });

//         // Expect not found error response
//         expect(response.statusCode).toBe(404);
//         expect(response.body).toHaveProperty("message", "Employee data not found");
//     });

//     // **Test Case: Reject Editing Employee Data with Invalid Token**
//     it("should reject editing employee data with an invalid token", async () => {
//         const response = await request(app)
//             .put(`/api/users/edit/${testEmployeeId}`)
//             .set("Authorization", "Bearer invalidtoken")
//             .send({ name: "Hacker" });

//         // Expect authentication error response
//         expect(response.statusCode).toBe(401);
//         expect(response.body).toHaveProperty("message", "Not authorized, invalid token");
//     });

//     // **Test Case: Allow Updating Email and Password Separately**
//     it("should allow updating email and password separately", async () => {
//         const response = await request(app)
//             .put(`/api/users/edit/${testEmployeeId}`)
//             .set("Authorization", `Bearer ${staffToken}`)
//             .send({ email: "updatedemail@example.com", password: "newpassword" });

//         // Expect successful response
//         expect(response.statusCode).toBe(200);
//         expect(response.body).toHaveProperty("message", "Employee data successfully updated");
//         expect(response.body.updatedFields.email).toBe("updatedemail@example.com");
//     });

//     // **Test Case: Unauthorized User Should Not Edit Employee Data**
//     it("should not allow unauthorized user to edit employee data", async () => {
//         const response = await request(app)
//             .put(`/api/users/edit/${testEmployeeId}`)
//             .set("Authorization", `Bearer ${adminToken}`) // Admin should not edit others' data
//             .send({ name: "Unauthorized" });

//         // Expect forbidden error response
//         expect(response.statusCode).toBe(403);
//         expect(response.body).toHaveProperty(
//             "message",
//             "You are not authorized to update this data"
//         );
//     });
// });
