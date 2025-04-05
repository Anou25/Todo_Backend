import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Illustration1 from "../assets/illustration1.jpeg";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      setError(""); // Clear previous errors

      const response = await axios.post("http://localhost:5000/api/auth/login", formData);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token); // Save token
        localStorage.setItem("role", response.data.user.role); // Save role

        // Redirect based on role
        if (response.data.user.role === "Admin") {
          navigate("/dashboard");
        } else {
          navigate("/userDashboard");
        }
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setError("Invalid email or password.");
      } else {
        setError("Login failed! Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://img.freepik.com/free-vector/abstract-cover-with-smooth-lines_1182-679.jpg?t=st=1743003181~exp=1743006781~hmac=f1ba867bcf1d089a4219846d99d6e5c86a1797fb3f974f9705df12f90e35ea9e&w=740')] bg-cover bg-center bg-no-repeat">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden flex w-[800px]">
        {/* Left Section - Decorative Panel */}
        <div className="w-1/2 bg-white relative flex items-center justify-center">
          <img src={Illustration1} alt="illustration"></img>
        </div>

        {/* Right Section - Form */}
        <div className="w-1/2 p-8 mt-10">
          <h2 className="text-2xl font-semibold mb-2 text-orange-600">Login</h2>
          <p className="text-gray-500 mb-6">Fill the form to login</p>

          {/* Error Message */}
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          {/* Input Fields */}
          <div className="space-y-4">
            <input type="email" name="email" placeholder="Enter your email"
              value={formData.email} onChange={handleChange}
              className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />

            <input type="password" name="password" placeholder="Enter your password"
              value={formData.password} onChange={handleChange}
              className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>

          {/* Login Button */}
          <button onClick={handleLogin} className="w-full mt-4 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition">
            Login
          </button>

          {/* Sign Up Link */}
          <p className="text-gray-600 text-sm mt-4 text-center">
            Don't have an account?{" "}
            <a href="/signup" className="text-orange-600 hover:underline">Signup</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
