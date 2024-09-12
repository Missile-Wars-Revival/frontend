import axios from "axios";

const uri = 'https://api.missilewars.dev';

const axiosInstance = axios.create({
  baseURL: uri,
});

export default axiosInstance;