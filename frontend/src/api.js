import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple redirects
let isRedirecting = false;

// Add token to request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling token expiration
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't redirect for login attempts
      if (originalRequest.url === "/api/auth/login") {
        return Promise.reject(error);
      }

      console.log("🔐 Token expired or invalid. Redirecting to login...");

      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login if not already there and not already redirecting
      if (!isRedirecting && window.location.pathname !== "/login") {
        isRedirecting = true;

        // Show modal or notification before redirect
        const event = new CustomEvent("auth:token-expired", {
          detail: { message: "Your session has expired. Please login again." },
        });
        window.dispatchEvent(event);

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = "/login";
          isRedirecting = false;
        }, 1500);
      }
    }

    console.error(`❌ Error ${error.response?.status}: ${error.config?.url}`);
    return Promise.reject(error);
  },
);

export default api;
