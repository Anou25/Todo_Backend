require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require("./config/db");

const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(
    cors({
        origin: "http://localhost:5173", // Explicitly allow frontend URL
        credentials: true, // Allow cookies and authentication headers
        methods: "GET,POST,PUT,DELETE", // Specify allowed methods
        allowedHeaders: "Content-Type,Authorization" // Allow required headers
    })
);
app.use(express.json());

// MongoDB Connection
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',taskRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Project Management API is Running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
