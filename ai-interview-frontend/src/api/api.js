import axios from "axios";
import debug from "../utils/debug";

const BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // required when backend uses allow_credentials=True (no CORS errors)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const payload = config.data instanceof FormData ? "[FormData]" : config.params || config.data;
  debug.api("Request bhej rahe hain", `${config.method?.toUpperCase()} ${config.url}`, payload);
  return config;
});

api.interceptors.response.use(
  (response) => {
    debug.apiResponse(`${response.config.method?.toUpperCase()} ${response.config.url}`, response.status, response.data);
    return response;
  },
  (err) => {
    debug.error("API", "Backend se error aaya", {
      url: err.config?.url,
      status: err.response?.status,
      detail: err.response?.data,
    });
    return Promise.reject(err);
  }
);

export default api;
export { BASE_URL };
