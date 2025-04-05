const express = require("express");
const { authenticateUser, authorizeAdmin } = require("../middleware/auth.middleware");
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} = require("../controllers/user.controller");


const router = express.Router();


router.get("/", authenticateUser, authorizeAdmin, getAllUsers); // Get all users (Admin only)
router.get("/:id", authenticateUser, getUserById); // Get user by ID
router.post("/", authenticateUser, authorizeAdmin, createUser); // Create a new user (Admin only)
router.put("/:id", authenticateUser, authorizeAdmin, updateUser); // Update user (Admin only)
router.delete("/:id", authenticateUser, authorizeAdmin, deleteUser); // Delete user (Admin only)

module.exports = router;
