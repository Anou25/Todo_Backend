const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
require("dotenv").config();

// Middleware to Authenticate Users via JWT
exports.authenticateUser = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const token = authHeader.split(" ")[1]; // safely extract token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({ message: "Invalid token payload: missing user ID" });
        }

        req.user = decoded; // will contain { id, email, etc. }
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Middleware to Authorize Only Admin Users
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

// Middleware to Authorize if User is Admin or Updating Own Profile
exports.authorizeSelfOrAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        const isSelf = req.user.id === req.params.id;
        const isAdmin = user && user.role === "Admin";

        if (isSelf || isAdmin) {
            next();
        } else {
            return res.status(403).json({ message: "Access denied - Not authorized" });
        }
    } catch (error) {
        console.error("Authorization Error:", error.message);
        res.status(500).json({ message: "Server error during authorization" });
    }
};
