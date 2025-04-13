 
 
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { List, message, Button, Modal, Form, Input, Select, DatePicker } from "antd";
import TaskForm from "./TaskForm";
import dayjs from "dayjs";
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
const { Option } = Select;

const ProjectDetails = () => {
    const { projectId: id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editForm] = Form.useForm();
    const [currentTask, setCurrentTask] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState(null); // [startDate, endDate]

    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/projects/${id}`, { headers });
            setProject(response.data);
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error("Error fetching project details:", error);
        }
    };

    const handleCreateTask = async (taskData) => {
        try {
            const newTask = { ...taskData, id };
            const res = await axios.post("http://localhost:5000/api/tasks", newTask, { headers });
            console.log(res);
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

    const handleDeleteTask = async (taskId) => {
        try {
            await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, { headers });
            setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
            message.success("Task deleted successfully");
        } catch (error) {
            console.error("Error deleting task:", error);
            message.error("Failed to delete task");
        }
    };

    const handleUpdateTask = async (taskId, updatedData) => {
        try {
            const response = await axios.put(`http://localhost:5000/api/tasks/${taskId}`, updatedData, { headers });
            setTasks((prevTasks) =>
                prevTasks.map((task) => (task._id === taskId ? { ...task, ...response.data } : task))
            );
            message.success("Task updated successfully");
        } catch (error) {
            console.error("Error updating task:", error);
            message.error("Failed to update task");
        }
    };

    const openEditModal = (task) => {
        setCurrentTask(task);
        editForm.setFieldsValue({
            taskTitle: task.taskTitle,
            taskDescription: task.taskDescription,
            assignedUser: task.assignedUser?._id || null,
            startDate: dayjs(task.startDate),
            endDate: dayjs(task.endDate),
            status: task.taskStatus,
        });
        setIsEditModalVisible(true);
    };

    const handleEditSubmit = async () => {
        try {
            const values = await editForm.validateFields();
            const updatedData = {
                ...values,
                taskStatus: values.status,
                startDate: values.startDate.toISOString(),
                endDate: values.endDate.toISOString(),
            };
            await handleUpdateTask(currentTask._id, updatedData);
            // if (values.status !== currentTask.status) {
            //     await handleStatusUpdate(currentTask._id, values.status);
            // }

            setIsEditModalVisible(false);
            setCurrentTask(null);
        } catch (err) {
            console.error("Validation failed:", err);
        }
    };
    const filteredTasks = tasks.filter((task) => {
        const matchesSearch =
            task.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.assignedUser &&
                (task.assignedUser.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    task.assignedUser.email?.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesStatus =
            statusFilter === "all" || task.taskStatus?.toLowerCase().trim() === statusFilter.toLowerCase().trim();



        const matchesDate =
            !dateFilter || (
                dateFilter[0] &&
                dateFilter[1] &&
                dayjs(task.startDate).isSameOrAfter(dayjs(dateFilter[0]), 'day') &&
                dayjs(task.endDate).isSameOrBefore(dayjs(dateFilter[1]), 'day')
            );

        //console.log("Task status:", task.taskStatus);

        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleBack = () => {
        navigate("/dashboard?tab=projects");
    };

    if (!project) return <p>Loading...</p>;

    return (
        <div className="p-6 bg-white rounded shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-orange-600">{project.projectTitle}</h2>
                <Button onClick={handleBack} className="!bg-orange-400 !text-white hover:!bg-orange-500">
                    ← Back
                </Button>
            </div>

            <p className="text-gray-700 mb-4">{project.projectDescription}</p>

            <div className="mb-4">
                <h3 className="text-lg font-bold !text-orange-600">Assigned Users:</h3>
                {Array.isArray(project.assignedUsers) && project.assignedUsers.length > 0 ? (
                    <ul className="list-disc list-inside">
                        {project.assignedUsers.map((user) => (
                            <option key={user._id}>
                                {user.fullName || user.email || "Unnamed User"}
                            </option>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No users assigned.</p>
                )}
            </div>

            <p className="text-orange-600 mb-2">
                <strong>Created By:</strong> {project.createdBy?.fullname || project.createdBy?.email || "N/A"}
            </p>

            <div className="mb-6">
                <h2 className="text-lg font-bold mb-2 text-orange-600">Tasks:</h2>

                <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Search by title or user"
                        className="w-full md:w-1/2 p-2 border border-gray-300 rounded"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <select
                        className="w-full md:w-1/4 p-2 border border-gray-300 rounded"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>

                    <DatePicker.RangePicker
                        value={dateFilter}
                        onChange={(dates) => setDateFilter(dates)}
                        className="w-full md:w-1/3 border border-gray-300 rounded"
                        style={{ padding: "0.5rem" }}
                    />
                </div>


                <List
                    bordered
                    dataSource={filteredTasks}
                    renderItem={(task) => (
                        <List.Item>
                            <div className="p-3 border rounded-lg w-full">
                                <p><strong>Task Name:</strong> {task.taskTitle}</p>
                                <p><strong>Task Description:</strong> {task.taskDescription}</p>
                                <p><strong>Assigned User:</strong>
                                    {task.assignedUser
                                        ? task.assignedUser.fullName || task.assignedUser.email || "Unnamed User"
                                        : <span className="text-gray-500 italic">Unassigned</span>}
                                </p>

                                <p><strong>Start Date:</strong> {new Date(task.startDate).toLocaleDateString()}</p>
                                <p><strong>End Date:</strong> {new Date(task.endDate).toLocaleDateString()}</p>

                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="flex items-center">
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

                                    <div className="flex gap-2">
                                        <Button size="small" onClick={() => openEditModal(task)} className="border !border-green-500 !text-green-500">
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            danger
                                            onClick={() => {
                                                if (window.confirm("Are you sure you want to delete this task?")) {
                                                    handleDeleteTask(task._id);
                                                }
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </div>

            <TaskForm assignedUsers={project.assignedUsers} onTaskSubmit={handleCreateTask} />

            <Modal
                title="Edit Task"
                open={isEditModalVisible}
                onOk={handleEditSubmit}
                onCancel={() => setIsEditModalVisible(false)}
                okText="Update"
                okButtonProps={{
                    style: { backgroundColor: '#fa8c16', borderColor: '#fa8c16' }, 
                    className: 'text-white'
                }}
            >
                <Form layout="vertical" form={editForm}>
                    <Form.Item label="Task Title" name="taskTitle" rules={[{ required: true, message: "Required" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Task Description" name="taskDescription" rules={[{ required: true, message: "Required" }]}>
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item label="Assigned User" name="assignedUsers" rules={[{ required: true }]}>
                        <Select placeholder="Select a user">
                            {project.assignedUsers?.map((user) => (
                                <li key={user._id} value={user._id}>
                                    {user.fullName || user.email}
                                </li>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Start Date" name="startDate" rules={[{ required: true }]}>
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item label="End Date" name="endDate" rules={[{ required: true }]}>
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                        <Select>
                            <Option value="Pending">Pending</Option>
                            <Option value="In Progress">In Progress</Option>
                            <Option value="Completed">Completed</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProjectDetails;
