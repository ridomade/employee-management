# Employee Management System

## Description

This is a **Node.js-based Employee Management System** designed to handle employee records, authentication, and data storage efficiently.

## Features

| Feature             | Description                                            |
| ------------------- | ------------------------------------------------------ |
| 🔑 Authentication   | JWT-based login and registration                       |
| 📁 CRUD Operations  | Add, edit, delete, and retrieve employee records       |
| 🔐 Secure Passwords | Bcrypt password hashing                                |
| 🗄️ Database         | MySQL integration                                      |
| 🏗️ API Routes       | RESTful API structure for employee and user management |

## Installation

To set up the project, run:

npm install

## Environment Configuration

Create a `.env` file in the root directory and add:

DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_secret_key

## Usage

| Command       | Description                         |
| ------------- | ----------------------------------- |
| `npm start`   | Start the server                    |
| `npm run dev` | Start the server with hot-reloading |

## Project Structure

| Directory/File | Description                                              |
| -------------- | -------------------------------------------------------- |
| `server.js`    | Main entry point for the backend server                  |
| `config/`      | Configuration files (database, environment)              |
| `routes/`      | API endpoints for authentication and employee management |
| `models/`      | Database models                                          |
| `controllers/` | Business logic for handling requests                     |

### Routes

| Route                 | Method | Description                    |
| --------------------- | ------ | ------------------------------ |
| `/api/users/register` | POST   | Register a new user            |
| `/api/users/login`    | POST   | Authenticate user & return JWT |
| `/api/users/:id`      | DELETE | Delete employee account        |
| `/api/validate`       | GET    | Validate token provided        |
| `/api/users/add`      | POST   | Add employee data              |
| `/api/users/edit/:id` | PUT    | Edit existing employee data    |

## Dependencies

| Package        | Version | Description                     |
| -------------- | ------- | ------------------------------- |
| `bcrypt`       | ^5.1.1  | Password hashing                |
| `cors`         | ^2.8.5  | Cross-Origin Resource Sharing   |
| `dotenv`       | ^16.4.7 | Environment variable management |
| `express`      | ^4.21.2 | Node.js web framework           |
| `jsonwebtoken` | ^9.0.2  | JWT authentication              |
| `mysql2`       | ^3.12.0 | MySQL database driver           |
| `nodemon`      | ^3.1.9  | Development hot-reloading       |

### Development Dependencies

| Package     | Version | Description               |
| ----------- | ------- | ------------------------- |
| `jest`      | ^29.7.0 | Testing framework         |
| `supertest` | ^7.0.0  | HTTP assertions for tests |

## Contribution

To contribute:

1. **Fork** the repository
2. **Clone** your fork
3. **Create a new branch** (`git checkout -b feature-branch`)
4. **Commit your changes** (`git commit -m "Description of changes"`)
5. **Push to the branch** (`git push origin feature-branch`)
6. **Create a Pull Request** for review

## License

This project is licensed under the **MIT License**.
