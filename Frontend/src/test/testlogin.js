import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const LoginTest = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Starting login request to:", `${API_URL}/api/auth/login`);
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      console.log("Login Success:", response.data);
      
      // Store authentication data in local storage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      // Debug: Check what we're getting from API
      console.log("User role:", response.data.user.role);
      console.log("isFirstLogin flag:", response.data.user.isFirstLogin);

      // Check if this is a staff member by checking for company association or staffRole
      const isStaffMember = response.data.user.company || response.data.token.includes("staffRole");

      // STEP 1: Handle special account states
      if (response.data.user.role === "company" && !response.data.user.isApproved) {
        console.log("Company not approved - redirecting to pending-approval");
        navigate('/pending-approval', { replace: true });
        return;
      }

      // STEP 2: Handle staff onboarding
      // Check if staff member needs to complete first-time setup
      if (isStaffMember && response.data.user.isFirstLogin) {
        console.log("Staff first login detected - redirecting to /first-login");
        navigate('/first-login', { replace: true });
        return;
      }

      // STEP 3: Route to appropriate dashboard
      const getDashboardPath = (user) => {
        if (user.role === "admin") return "/admin-dashboard";
        if (user.role === "client") return "/client-dashboard";
        if (user.role === "company") return "/company-dashboard";
        if (isStaffMember) return "/staff-dashboard"; // Any staff role goes to staff dashboard
        return "/";
      };

      const targetPath = getDashboardPath(response.data.user);
      console.log(`Normal flow - redirecting to ${targetPath} for ${response.data.user.role} role`);
      navigate(targetPath, { replace: true });

    } catch (err) {
      console.error("Login error details:", err);
      if (err.response) {
        console.error("Server response:", err.response.status, err.response.data);
      } else if (err.request) {
        console.error("No response received from server");
      } else {
        console.error("Error setting up request:", err.message);
      }
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginTest;
