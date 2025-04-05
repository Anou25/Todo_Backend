const express = require("express");
const { authenticateUser } = require("../middleware/auth.middleware");
const {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
} = require("../controllers/task.controller");

const router = express.Router();

router.get("/", authenticateUser, getAllTasks); // Get all tasks
router.get("/:id", authenticateUser, getTaskById); // Get task by ID
router.post("/", authenticateUser, createTask); // Create task
router.put("/:id", authenticateUser, updateTask); // Update task
router.delete("/:id", authenticateUser, deleteTask); // Delete task




module.exports = router;
