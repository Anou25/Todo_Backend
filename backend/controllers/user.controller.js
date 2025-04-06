const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

// Get all users (Admin only)
// exports.getAllUsers = async (req, res) => {
//     try {
//         const users = await User.find().select("-password"); // Exclude password
//         res.json(users);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// }; 

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $regex: /^user$/i } }).select("-password"); // Filter by role
        console.log(users); 
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get a single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new user (Admin only)
exports.createUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ fullName, email, password: hashedPassword, role });

        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user details (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const { fullName, email, role } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { fullName, email, role },
            { new: true }
        ).select("-password");

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
