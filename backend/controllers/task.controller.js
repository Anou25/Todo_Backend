const Task = require("../models/task.model");
const Project = require("../models/project.model");

// Get all tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().populate("assignedUser", "fullName email").populate("projectId", "projectTitle");
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate("assignedUser", "fullName email").populate("projectId", "projectTitle");
        if (!task) return res.status(404).json({ message: "Task not found" });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const {
            taskTitle,
            taskDescription,
            assignedUser, // from frontend, expected to be a single user ID
            startDate,
            endDate,
            status,
            id // projectId from frontend
        } = req.body;

        const projectId = id;
        const assignedUserArray = assignedUser ? [assignedUser] : [];

        const newTask = await Task.create({
            taskTitle,
            taskDescription,
            taskStatus: status || "Pending",
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            projectId,
            assignedUser: assignedUserArray,
            createdBy: req.user.id // use _id from token
        });

        // Optional: Push task ID to the project's `tasks` array (if exists)
        await Project.findByIdAndUpdate(projectId, {
            $push: { tasks: newTask._id }
        });

        // Populate assignedUser field (instead of non-existent assignedUsers)
        const populatedTask = await Task.findById(newTask._id)
            .populate("assignedUser", "fullName email");

        res.status(201).json(populatedTask);

    } catch (error) {
        console.error("Error creating task:", error.message);
        res.status(500).json({ message: "Error creating task", error: error.message });
    }
};


// Update a task
exports.updateTask = async (req, res) => {
    try {

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (!updatedTask) return res.status(404).json({ message: "Task not found" });

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) return res.status(404).json({ message: "Task not found" });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 

// Get tasks by project ID
exports.getTasksByProjectId = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        
        const tasks = await Task.find({ project: projectId })
            .populate("assignedUsers", "fullName email") // Optional: populate assigned users
            .populate("project", "projectTitle"); // Optional: populate project details

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks by project ID:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};