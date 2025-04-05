/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { List, message, Button } from "antd";
import TaskForm from "./TaskForm"; // Import TaskForm


const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // Proper placement
    
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No authentication token found.");
                return;
            }
             console.log("Provide id:",id)
            const response = await axios.get(`http://localhost:5000/api/projects/${id}`, {
                
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setProject(response.data);
            setTasks(response.data.tasks || []);
            console.log("Project");
        } catch (error) {
            console.error("Error fetching project details:", error);
        }
    };

    const handleCreateTask = async (taskData) => {
        try {
            const newTask = {
                ...taskData,
                id,
                status: "Pending",
            };

            const res = await axios.post("http://localhost:5000/api/tasks", newTask, { headers });

            if (res.data) {
                message.success("Task created successfully");
                setTasks((prevTasks) => [...prevTasks, res.data]);
            } else {
                message.error("Task creation failed");
            }
        } catch (err) {
            console.error("Error creating task:", err);
            message.error("Failed to create task");
        }
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/tasks/${taskId}`, { status: newStatus }, { headers });

            setTasks((prevTasks) =>
                prevTasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task))
            );

            message.success("Task status updated successfully");
        } catch (error) {
            console.error("Error updating task status:", error);
            message.error("Failed to update task status");
        }
    };

    const handleBack = () => {
        navigate("/dashboard?tab=projects"); //go back to Projects tab
    };

    if (!project) return <p>Loading...</p>;

    return (
        <div className="p-6 bg-white rounded shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-orange-600">{project.projectTitle}</h2>
                <Button onClick={handleBack} className="!bg-orange-400 !text-white hover:!bg-orange-500">
                    ← Back to Projects
                </Button>
            </div>

            <p className="text-gray-700 mb-4">{project.projectDescription}</p>

            <div className="mb-4">
                <h3 className="text-lg font-semibold">Assigned Users:</h3>
                <ul className="list-disc list-inside">
                    {project.assignedUsers?.map((user) => (
                        <li key={user._id}>{user.fullname || user.email}</li>
                    ))}
                </ul>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Tasks:</h3>
                <List
                    bordered
                    dataSource={tasks}
                    renderItem={(task) => (
                        <List.Item>
                            <div className="p-3 border rounded-lg w-full">
                                <p><strong>Task Name:</strong> {task.taskTitle}</p>
                                <p><strong>Task Description:</strong> {task.taskDescription}</p>
                                <p><strong>Assigned User:</strong> {task.assignedUser?.fullname || "N/A"}</p>
                                <p><strong>Start Date:</strong> {new Date(task.startDate).toLocaleDateString()}</p>
                                <p><strong>End Date:</strong> {new Date(task.endDate).toLocaleDateString()}</p>

                                <div className="flex items-center mt-2">
                                    <strong>Task Status:</strong>
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                                        className="ml-2 p-1 border rounded"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </div>

            <TaskForm assignedUsers={project.assignedUsers} onTaskSubmit={handleCreateTask} />
        </div>
    );
};

export default ProjectDetails;
