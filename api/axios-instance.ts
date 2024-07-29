import axios from "axios";

const uri = process.env.EXPO_PUBLIC_BACKEND_URL;

const axiosInstance = axios.create({
  baseURL: uri,
});

export default axiosInstance;