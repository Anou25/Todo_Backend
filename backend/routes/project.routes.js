const express = require("express");
const { authenticateUser } = require("../middleware/auth.middleware");
const {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
} = require("../controllers/project.controller");

const router = express.Router();

router.get("/", authenticateUser, getAllProjects); // Get all projects
router.get("/:id", authenticateUser, getProjectById); // Get a single project
router.post("/", authenticateUser, createProject); // Create a project
router.put("/:id", authenticateUser, updateProject); // Update project
router.delete("/:id", authenticateUser, deleteProject); // Delete project

module.exports = router;
