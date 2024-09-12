import axios from "axios";

const uri = 'http://172.20.10.13:3000';

const axiosInstance = axios.create({
  baseURL: uri,
});

export default axiosInstance;