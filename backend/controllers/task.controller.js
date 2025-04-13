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
        //console.log("Request body:", req.body);

        const {
            taskTitle,
            taskDescription,
            assignedUser, // single user ID from frontend
            startDate,
            endDate,
            status,
            id // projectId
        } = req.body;

        const projectId = id;
        const assignedUsers = [assignedUser]; // convert to array

        const newTask = await Task.create({
            taskTitle,
            taskDescription,
            taskStatus: status || "Pending",
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            projectId,
            assignedUsers,
            createdBy: req.user.id
        });

        // Push task into the project's task list
        await Project.findByIdAndUpdate(projectId, {
            $push: { tasks: newTask._id }
        });

        // Populate assignedUsers before sending back
        const populatedTask = await Task.findById(newTask._id)
            .populate("assignedUsers", "fullName email"); // only select fullname and email

        res.status(201).json(populatedTask);
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: error.message });
    }
};



// Update a task
exports.updateTask = async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (!updatedTask) return res.status(404).json({ message: "Task not found" });
        //console.log("Updated Task:", updatedTask); //  Add this
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