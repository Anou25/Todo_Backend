const mongoose = require("mongoose");
const projectSchema = new mongoose.Schema({
    projectTitle: { 
        type: String, 
        required: true 
    },
    projectDescription: { 
        type: String, 
        required: true 
    },
    projectStatus: { 
        type: String, 
        enum: ["Pending", "In Progress", "Completed"], 
        default: "Pending" 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    isDelete: { 
        type: Boolean, 
        default: false 
    },
    assignedUsers: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        }
    ], 
    tasks: [ 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task"
        }
    ],
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    }, 
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);




