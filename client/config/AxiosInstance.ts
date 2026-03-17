import axios from "axios";

// 1. Module-level memory storage for the Access Token
let currentAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

const AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000",
  withCredentials: true, // Crucial for sending the HttpOnly refresh cookie
});

// 2. REQUEST INTERCEPTOR: Automatically attach token to every request
AxiosInstance.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

// 3. RESPONSE INTERCEPTOR: Handle expired tokens silently
AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 (Unauthorized) and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to get a new access token using the HttpOnly cookie
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000"}/users/refresh`,
          { withCredentials: true },
        );

        // Update memory state and the failed request header
        setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // Retry the original request
        return AxiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails (cookie expired/tampered), force logout
        setAccessToken(null);
        window.location.href = "/login?error=SessionExpired";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default AxiosInstance;
