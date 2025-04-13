/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Switch,
  message,
} from "antd";
import {
  UserOutlined,
  ProjectOutlined,
  PlusOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProjectsComponent from "./ProjectsComponent";

const { Sider, Content } = Layout;
const { Option } = Select;
const API_URL = "http://localhost:5000/api/users";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "users";

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [users, setUsers] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


  const navigate = useNavigate();

  const updateTabInUrl = (tab) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    updateTabInUrl(key);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(API_URL, { headers });
      setUsers(response.data);
    } catch (error) {
      message.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => {
      const shouldRefresh = localStorage.getItem("refreshUsers");
      if (shouldRefresh === "true") {
        fetchUsers(); // Refresh users in admin dashboard
        localStorage.setItem("refreshUsers", "false"); // reset trigger
      }
    }, 2000); // check every 2 seconds

    return () => clearInterval(interval);
  }, []);


  const handleSaveUser = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingUser) {
        await axios.put(`${API_URL}/${editingUser._id}`, values, { headers });
        message.success("User updated successfully!");
      } else {
        await axios.post(API_URL, values, { headers });
        message.success("User added successfully!");
      }

      // Re-fetch the updated users list from backend
      const updatedUsers = await axios.get(API_URL, { headers });
      setUsers(updatedUsers.data);

      setDrawerVisible(false);
      setEditingUser(null);
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || "Unauthorized! Please log in.");
    }
  };


  const handleEditUser = (record) => {
    setEditingUser(record);
    setDrawerVisible(true);
    form.setFieldsValue(record);
  };

  const handleDeleteUser = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_URL}/${id}`, { headers });
      setUsers(users.filter((user) => user._id !== id));
      alert("User deleted successfully!");
    } catch (error) {
      message.error("Failed to delete user");
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Update status in backend
      await axios.put(`${API_URL}/${id}`, { isActive }, { headers });

      // Update status in local state immediately
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === id ? { ...user, isActive } : user
        )
      );
    } catch (error) {
      message.error("Failed to update status");
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesStatus;
  });


  return (
    <Layout className="h-screen">
      <Sider width={250} className="!bg-orange-500 text-white h-screen">
        <div className="text-white text-xl font-bold p-6 text-center border-b border-orange-200">
          Admin Panel
        </div>
        <Menu
          theme="dark"
          mode="vertical"
          selectedKeys={[activeTab]}
          onClick={({ key }) => {
            if (key === "logout") {
              handleLogout();
            } else {
              handleTabChange(key);
            }
          }}
          className="!bg-orange-500 text-white border-none"
          items={[
            {
              key: "users",
              icon: <UserOutlined />,
              label: "Users",
              className: `hover:!bg-orange-400 ${activeTab === "users" ? "!bg-white !text-orange-500 font-semibold" : ""
                }`,
            },
            {
              key: "projects",
              icon: <ProjectOutlined />,
              label: "Projects",
              className: `hover:!bg-orange-400 ${activeTab === "projects" ? "!bg-white !text-orange-500 font-semibold" : ""
                }`,
            },
            {
              key: "logout",
              icon: <LogoutOutlined />,
              label: <span className="!text-red-500 font-bold">Logout</span>,
              className: "!bg-white mb-5",
            },
          ]}
        />
      </Sider>

      <Layout className="h-full w-full">
        <Content className="p-6 bg-orange-50 h-full overflow-auto">
          {activeTab === "users" && (
            <>
              <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-semibold text-orange-600">Users</h2>
                <div className="flex gap-3 items-center">
                  <Input
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                    style={{ width: 200 }}
                  />

                  <Select
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value)}
                    style={{ width: 150 }}
                  >
                    <Select.Option value="all">All</Select.Option>
                    <Select.Option value="active">Active</Select.Option>
                    <Select.Option value="inactive">Inactive</Select.Option>
                  </Select>

                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="!bg-orange-500 hover:!bg-orange-600 border-none"
                    onClick={() => {
                      setEditingUser(null);
                      setDrawerVisible(true);
                      form.resetFields();
                    }}
                  >
                    Add User
                  </Button>
                </div>
              </div>
             
              <Table
                className="custom-orange-table"
                //dataSource={users}
                dataSource={filteredUsers}
                rowKey="_id"
                columns={[
                  { title: "Full Name", dataIndex: "fullName", key: "fullName" },
                  { title: "Email", dataIndex: "email", key: "email" },
                  { title: "Role", dataIndex: "role", key: "role" },
                  {
                    title: "Status",
                    dataIndex: "isActive",
                    key: "isActive",
                    render: (text, record) => (
                      <Switch
                        checked={record.isActive}
                        onChange={(checked) => handleToggleStatus(record._id, checked)}
                        className="orange-switch"
                      />
                    ),
                  },
                  {
                    title: "Actions",
                    key: "actions",
                    render: (_, record) => (
                      <span className="flex justify-center items-center gap-2">
                        <Button
                          onClick={() => handleEditUser(record)}
                          className="border !border-green-500 !text-green-500"
                        >
                          Edit
                        </Button>
                        <Button danger onClick={() => handleDeleteUser(record._id)}>
                          Delete
                        </Button>
                      </span>
                    ),
                  },
                ]}
                pagination={{ pageSize: 7 }}
                bordered
              />

              <Drawer
                title={
                  <span className="text-orange-600">
                    {editingUser ? "Edit User" : "Add New User"}
                  </span>
                }
                width={350}
                onClose={() => {
                  setDrawerVisible(false);
                  setEditingUser(null);
                  form.resetFields();
                }}
                open={drawerVisible}
              >
                <Form layout="vertical" form={form} onFinish={handleSaveUser}>
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[{ required: true, message: "Please enter full name" }]}
                  >
                    <Input placeholder="Enter full name" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, type: "email", message: "Enter valid email" },
                    ]}
                  >
                    <Input placeholder="Enter email" />
                  </Form.Item>
                  {!editingUser && (
                    <Form.Item
                      name="password"
                      label="Password"
                      rules={[{ required: true, message: "Enter password" }]}
                    >
                      <Input.Password placeholder="Enter password" />
                    </Form.Item>
                  )}
                  <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                    <Select placeholder="Select role">
                      <Option value="Admin">Admin</Option>
                      <Option value="User">User</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="isActive"
                    label="Active Status"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="!bg-orange-500 w-full hover:!bg-orange-600 border-none"
                  >
                    {editingUser ? "Update User" : "Add User"}
                  </Button>
                </Form>
              </Drawer>
            </>
          )}


          {activeTab === "projects" && <ProjectsComponent />}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
