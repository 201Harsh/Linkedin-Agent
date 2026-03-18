import axios from "axios";

export const setAccessToken = (token: string | null) => {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }
};

const getAccessToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};

const AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000",
  withCredentials: true, // Crucial for sending the HttpOnly refresh cookie
});

AxiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000"}/users/refresh`,
          { withCredentials: true },
        );

        setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return AxiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails (cookie expired/tampered), force logout
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login?error=SessionExpired";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default AxiosInstance;
