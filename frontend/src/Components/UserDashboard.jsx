/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Layout, Menu, Table, Card, Button, Tag, Select, message } from "antd";
import {
    ProjectOutlined,
    ProfileOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

const { Sider, Content } = Layout;
const { Option } = Select;

const UserDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [selectedProject, setSelectedProject] = useState(null);
    const navigate = useNavigate();
    // const [searchParams] = useSearchParams();
    // const defaultTab = searchParams.get("tasks") || "profile";
    const [activeTab, setActiveTab] = useState("tasks");
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get("http://localhost:5000/api/projects", { headers });
                setProjects(response.data);
            } catch (error) {
                message.error("Failed to fetch projects");
            }
        };
        fetchProjects();
    }, []);

    const fetchTasks = async (projectId) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`http://localhost:5000/api/tasks/${projectId}`, { headers });
            setTasks(response.data);
            setSelectedProject(projectId);
        } catch (error) {
            message.error("Failed to fetch tasks");
        }
    };

    const handleStatusChange = async (taskId, status) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.put(`http://localhost:5000/api/tasks/${taskId}`, { status }, { headers });
            message.success("Task status updated");
            fetchTasks(selectedProject);
        } catch (error) {
            message.error("Failed to update status");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <Layout className="h-screen">
            <Sider width={250} className="!bg-orange-500 text-white h-screen">
                <div className="text-white text-xl font-bold p-6 text-center border-b border-orange-200">
                    USER PANEL
                </div>
                <Menu
                    theme="dark"
                    mode="vertical"
                    selectedKeys={[activeTab]}
                    onClick={({ key }) => {
                        if (key === "logout") {
                            handleLogout();
                        } else {
                            setActiveTab(key);
                        }
                    }}
                    className="!bg-orange-500 text-white border-none"
                    items={[
                        {
                            key: "tasks",
                            icon: <ProjectOutlined />,
                            label: "All Tasks",
                            className: `hover:!bg-orange-400 ${activeTab === "tasks" ? "!bg-white !text-orange-500 font-semibold" : ""
                                }`,
                            
                        },
                        {
                            key: "profile",
                            icon: <ProfileOutlined />,
                            label: "Update Profile",
                            className: `hover:!bg-orange-400 ${activeTab === "profile" ? "!bg-white !text-orange-500 font-semibold" : ""
                                }`,
                        },
                        {
                            key: "logout",
                            icon: <LogoutOutlined />,
                            label: <span className="!text-red-500 font-bold">Logout</span>,
                            className: "!bg-white mb-5",
                            onClick: handleLogout,
                        },
                    ]}
                />
            </Sider>

            <Layout>
                <Content className="p-6 bg-orange-50 h-full overflow-auto">
                    <h2 className="text-2xl font-semibold text-orange-600">Your Projects</h2>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        {projects.map((project) => (
                            <Card
                                key={project._id}
                                title={project.name}
                                className="border border-orange-400"
                                extra={<Button onClick={() => fetchTasks(project._id)}>View Tasks</Button>}
                            >
                                <p>{project.description}</p>
                            </Card>
                        ))}
                    </div>

                    {selectedProject && (
                        <div className="mt-6">
                            <h2 className="text-2xl font-semibold text-orange-600">Tasks</h2>
                            <Table
                                dataSource={tasks}
                                rowKey="_id"
                                columns={[
                                    { title: "Task Name", dataIndex: "name", key: "name" },
                                    { title: "Description", dataIndex: "description", key: "description" },
                                    {
                                        title: "Status",
                                        dataIndex: "status",
                                        key: "status",
                                        render: (text, record) => (
                                            <Select
                                                defaultValue={record.status}
                                                onChange={(value) => handleStatusChange(record._id, value)}
                                            >
                                                <Option value="Pending">Pending</Option>
                                                <Option value="In Progress">In Progress</Option>
                                                <Option value="Completed">Completed</Option>
                                            </Select>
                                        ),
                                    },
                                ]}
                                pagination={{ pageSize: 5 }}
                                bordered
                            />
                        </div>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default UserDashboard;
