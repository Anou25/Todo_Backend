const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Convert email to lowercase
        const normalizedEmail = email.toLowerCase();

        let user = await User.findOne({ email: normalizedEmail });
        if (user) return res.status(400).json({ message: 'User already exists' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ fullName, email: normalizedEmail, password, role });

        // Save user to the database
        await user.save();
        res.status(201).json({ message: 'User registered successfully', user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        //console.log("Login Attempt Email:", email); // Debugging
        // Convert email to lowercase for consistent comparison
        const normalizedEmail = email.toLowerCase();

        let user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(400).json({ message: 'Invalid email' });
        //console.log("Stored Hashed Password:", user.password); // Debugging
        //console.log("Entered Password:", password); // Debugging
        // Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        // Generate and return JWT token
        const token = user.getSignedJwtToken();
        res.json({ token, user: { id: user._id, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


module.exports = router;
