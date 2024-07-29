import axios from "axios";

const uri = 'http://159.223.160.6:3000';

const axiosInstance = axios.create({
  baseURL: uri,
});

export default axiosInstance;