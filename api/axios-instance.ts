import axios from "axios";
import { getBackendUrl } from "./server-discovery";

// baseURL is resolved per-request so switching game servers (server picker)
// takes effect immediately, without recreating the instance or restarting.
const axiosInstance = axios.create({
  baseURL: getBackendUrl(),
});

axiosInstance.interceptors.request.use((config) => {
  config.baseURL = getBackendUrl();
  return config;
});

export default axiosInstance;
