 
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Button, Card, Modal, Form, Input, Select, DatePicker, message } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import dayjs from "dayjs";


const API_URL = "http://localhost:5000/api/projects";
const USERS_API_URL = "http://localhost:5000/api/users";

const ProjectsComponent = () => {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);



    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(API_URL, { headers });
            setProjects(response.data);
        } catch (error) {
            message.error("Failed to fetch projects");
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(USERS_API_URL, { headers });
            setUsers(response.data);
        } catch (error) {
            message.error("Failed to fetch users");
        }
    };

    const handleSaveProject = async (values) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};

            const payload = {
                projectTitle: values.projectTitle,
                projectDescription: values.projectDescription,
                projectStatus: values.projectStatus,
                startDate: values.startDate.format("YYYY-MM-DD"),
                endDate: values.endDate.format("YYYY-MM-DD"),
                assignedUsers: values.assignedUsers,
            };

            if (editingProject) {
                await axios.put(`${API_URL}/${editingProject._id}`, payload, { headers });
                setProjects((prevProjects) =>
                    prevProjects.map((project) =>
                        project._id === editingProject._id ? { ...project, ...payload } : project
                    )
                );
                message.success("Project updated successfully!");
            } else {
                const response = await axios.post(API_URL, payload, { headers });
                setProjects([...projects, response.data]);
                message.success("Project added successfully!");
            }
            setModalVisible(false);
            setEditingProject(null);
            form.resetFields();
        } catch (error) {
            console.error("Error:", error.response?.data || error.message);
            message.error("Failed to save project");
        }
    };
    

    const handleEditProject = (project) => {
        setEditingProject(project);
        setModalVisible(true);

        // Ensure correct field names
        form.setFieldsValue({
            projectTitle: project.projectTitle || "",
            projectDescription: project.projectDescription || "",
            projectStatus: project.projectStatus || "Pending",
            startDate: project.startDate ? moment(project.startDate) : null,
            endDate: project.endDate ? moment(project.endDate) : null,
            assignedUsers: project.assignedUsers ? project.assignedUsers.map(user => user._id) : [],
        });
    };


    const handleDeleteProject = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.delete(`${API_URL}/${id}`, { headers });
            setProjects(projects.filter((project) => project._id !== id));
            message.success("Project deleted successfully!");
        } catch (error) {
            message.error("Failed to delete project");
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-orange-600">Projects</h2>
                <Button type="primary" onClick={() => setModalVisible(true)} className="!bg-orange-500">Add Project</Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                {projects.map((project) => (
                    <Card key={project._id} title={project.projectTitle} className="shadow-md">
                        <p><strong>Description:</strong> {project.projectDescription}</p>
                        <p><strong>Status:</strong> {project.projectStatus}</p>
                        <p><strong>Start Date:</strong> {project.startDate}</p>
                        <p><strong>End Date:</strong> {project.endDate}</p>
                        <p><strong>Users:</strong> {project.assignedUsers.map(user => user.name).join(", ")}</p>
                        <div className="flex justify-between mt-4">
                            <Button onClick={() => handleEditProject(project)} className="border !border-green-500 !text-green-500">Edit</Button>
                            <Button
                                onClick={() => navigate(`/projects/${project._id}`)}
                                className="border !border-orange-500 !text-orange-500"
                            >
                                View Details
                            </Button>

                            <Button danger onClick={() => handleDeleteProject(project._id)}>Delete</Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal
                title={editingProject ? "Edit Project" : "Add Project"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form layout="vertical" form={form} onFinish={handleSaveProject}>
                    <Form.Item name="projectTitle" label="Project Name" rules={[{ required: true, message: "Please enter project name" }]}>
                        <Input placeholder="Enter project name" />
                    </Form.Item>
                    <Form.Item name="projectDescription" label="Project Description">
                        <Input.TextArea placeholder="Enter project description" />
                    </Form.Item>
                    <Form.Item name="projectStatus" label="Project Status" rules={[{ required: true, message: "Please select project status" }]}>
                        <Select placeholder="Select status">
                            <Select.Option value="Pending">Pending</Select.Option>
                            <Select.Option value="In Progress">In Progress</Select.Option>
                            <Select.Option value="Completed">Completed</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: "Please select start date" }]}>
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item name="endDate" label="End Date" rules={[{ required: true, message: "Please select end date" }]}>
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item name="assignedUsers" label="Assign Users">
                        <Select mode="multiple" placeholder="Select users">
                            {users.map(user => (
                                <Select.Option key={user._id} value={user._id}>{user.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" className="!bg-orange-500">
                        {editingProject ? "Update" : "Add"}
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default ProjectsComponent;
