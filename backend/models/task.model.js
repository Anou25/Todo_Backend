// const mongoose = require("mongoose");
// const taskSchema = new mongoose.Schema({
//     taskTitle: { 
//         type: String, 
//         required: true 
//     },
//     taskDescription: { 
//         type: String, 
//         required: true 
//     },
//     taskStatus: { 
//         type: String, 
//         enum: ["Panding", "In Progress", "Completed"], 
//         default: "Panding" 
//     },
//     startDate: { 
//         type: Date, 
//         required: true 
//     },
//     endDate: { 
//         type: Date, 
//         required: true 
//     },
//     isDelete: { 
//         type: Boolean, 
//         default: false 
//     },
//     projectId: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: "Project", 
//         required: true 
//     }, 
//     assignedUsers: [
//         { 
//             type: mongoose.Schema.Types.ObjectId, 
//             ref: "User" 
//         }
//     ], 
//     createdBy: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: "User", 
//         required: true 
//     }, 
// }, { timestamps: true });

// module.exports = mongoose.model("Task", taskSchema);


const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    taskTitle: {
        type: String,
        required: true
    },
    taskDescription: {
        type: String,
        required: true
    },
    taskStatus: {
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
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    assignedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
