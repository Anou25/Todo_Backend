const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
require("dotenv").config();

//Middleware to Authenticate Users via JWT
exports.authenticateUser = (req, res, next) => {
    const token = req.header("Authorization");

    //console.log("Received Token:", token); // Debugging

    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        //console.log("Decoded Token:", decoded); // Debugging
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

//Middleware to Authorize Only Admin Users
exports.authorizeAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied - Admins only" });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: "Server error while checking admin authorization" });
    }
};
