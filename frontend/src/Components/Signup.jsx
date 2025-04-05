import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Illustration from "../assets/illustration.jpeg";

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        role: "User", // Default role
    });

    const [error, setError] = useState(""); // State for error messages

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async () => {
        try {
            setError(""); // Clear previous errors

            const response = await axios.post("http://localhost:5000/api/auth/register", formData);

            if (response.status === 201) {
                alert("Signup successful! Please log in.");
                navigate("/login"); // Redirect to login after signup
            }
        } catch (error) {
            if (error.response?.status === 400 && error.response.data.message === "User already exists") {
                setError("This email is already registered. Please log in instead.");
            } else {
                setError("Signup failed. Please try again.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('https://img.freepik.com/free-vector/abstract-cover-with-smooth-lines_1182-679.jpg?t=st=1743003181~exp=1743006781~hmac=f1ba867bcf1d089a4219846d99d6e5c86a1797fb3f974f9705df12f90e35ea9e&w=740')] bg-cover bg-center bg-no-repeat">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden flex w-[800px]">
                {/* Left Section - Form */}
                <div className="w-1/2 p-8 mt-5">
                    <h2 className="text-2xl font-semibold mb-2 text-orange-600">Sign Up</h2>
                    <p className="text-gray-500 mb-6">Fill the form below to create your account</p>

                    {/* Error Message */}
                    {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

                    {/* Input Fields */}
                    <div className="space-y-4">
                        <input type="text" name="fullName" placeholder="Enter your full name"
                            value={formData.fullName} onChange={handleChange}
                            className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />

                        <input type="email" name="email" placeholder="Enter your email"
                            value={formData.email} onChange={handleChange}
                            className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />

                        <input type="text" name="phone" placeholder="Enter your Phone Number"
                            value={formData.phone} onChange={handleChange}
                            className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />

                        <input type="password" name="password" placeholder="Enter your password"
                            value={formData.password} onChange={handleChange}
                            className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />

                        <select name="role" value={formData.role} onChange={handleChange}
                            className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    {/* Sign Up Button */}
                    <button onClick={handleSignup} className="w-full mt-4 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition">
                        Sign Up
                    </button>

                    {/* Sign In Link */}
                    <p className="text-gray-600 text-sm mt-4 text-center">
                        Already have an account?{" "}
                        <a href="/login" className="text-orange-600 hover:underline">Login</a>
                    </p>
                </div>

                {/* Right Section - Decorative Panel */}
                <div className="w-1/2 bg-white relative flex items-center justify-center">
                    <img src={Illustration} alt="illustration"></img>
                </div>
            </div>
        </div>
    );
};

export default Signup;
