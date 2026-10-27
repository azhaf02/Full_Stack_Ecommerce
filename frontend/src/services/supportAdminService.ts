import axios from "axios";
import { API_BASE_URL, getSession } from "./authService";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
const session = getSession();

if (session) {
config.headers.Authorization = `Bearer ${session.token}`;
}

return config;
});

export default api;
