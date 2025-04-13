const Task = require("../models/task.model.js");
const Project = require("../models/project.model.js");

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
        .populate("assignedUsers", "fullName email")
        .populate("createdBy", "fullname email"); 

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }   
};


//Get a single project by ID
exports.getProjectById = async (req, res) => {
    // console.log(req);
    // console.log("Hi:",req.params.id);
    try {
        const project = await Project.findById(req.params.id)
            .populate('assignedUsers', 'fullname email') // Populate assigned users with full names and emails
            .populate({
                path: 'tasks',
                populate: {
                    path: 'assignedUser',
                    select: 'fullname email'
                }
            })
            .populate("createdBy", "fullname email");  

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json(project);
        console.log(project);
    } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new project
 // Ensure Project model is imported



 exports.createProject = async (req, res) => {
     try {
         const {
             projectTitle,
             projectDescription,
             projectStatus,
             startDate,
             endDate,
             assignedUsers
         } = req.body;
 
        //  console.log("Incoming Project Data:", req.body);
        //  console.log("Authenticated User ID:", req.user?.id);
 
         // Optional: Basic validation
         if (!projectTitle || !projectDescription || !startDate || !endDate) {
             return res.status(400).json({ message: "Please provide all required fields." });
         }
 
         const newProject = await Project.create({
             projectTitle,
             projectDescription,
             projectStatus,
             startDate: new Date(startDate),
             endDate: new Date(endDate),
             assignedUsers,
             createdBy: req.user.id,
         });
 
         return res.status(201).json(newProject);
     } catch (error) {
         console.error("Error while creating project:", error);
         return res.status(500).json({
             message: "Failed to create project",
             error: error.message,
         });
     }
 };
 

//Update a project
exports.updateProject = async (req, res) => {
    try {
        const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedProject) return res.status(404).json({ message: "Project not found" });

        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const deletedProject = await Project.findByIdAndDelete(req.params.id);
        if (!deletedProject) return res.status(404).json({ message: "Project not found" });

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get all projects assigned to a specific user
exports.getProjectsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`Fetching projects for user ID: ${userId}`);

        const projects = await Project.find({ assignedUsers: userId })
            .populate("assignedUsers", "fullName email")
            .populate("createdBy", "fullName email")
            .populate("tasks");

        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching projects by user ID:", error.stack);
        res.status(500).json({ message: "Error fetching projects by user ID", error: error.message });
    }
};

