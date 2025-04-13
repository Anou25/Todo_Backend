import React from "react";
import { Form, Input, Select, Button, DatePicker } from "antd";

const { Option } = Select;

const TaskForm = ({ assignedUsers, onTaskSubmit }) => {
    const [form] = Form.useForm();

    const handleSubmit = (values) => {
        onTaskSubmit(values);
        form.resetFields();
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="taskTitle" label="Task Name" rules={[{ required: true, message: "Task Name is required" }]}>
                <Input placeholder="Enter task name" />
            </Form.Item>

            <Form.Item name="taskDescription" label="Task Description" rules={[{ required: true, message: "Task Description is required" }]}>
                <Input.TextArea placeholder="Enter task description" />
            </Form.Item>

            <Form.Item name="assignedUser" label="Assign User" rules={[{ required: true, message: "Select a user" }]}>
                <Select placeholder="Select a user">
                    {assignedUsers.map((user) => (
                        <Option key={user._id} value={user._id}>{user.fullName || user.email}</Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: "Start Date is required" }]}>
                <DatePicker />
            </Form.Item>

            <Form.Item name="endDate" label="End Date" rules={[{ required: true, message: "End Date is required" }]}>
                <DatePicker />
            </Form.Item>

            <Form.Item name="status" label="Task Status" initialValue="Pending">
                <Select>
                    <Option value="Pending">Pending</Option>
                    <Option value="In Progress">In Progress</Option>
                    <Option value="Completed">Completed</Option>
                </Select>
            </Form.Item>

            <Button type="primary" htmlType="submit" className="!bg-orange-500">Add Task</Button>
        </Form>
    );
};

export default TaskForm;
