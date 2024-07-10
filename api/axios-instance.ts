import axios from "axios";
import Constants from "expo-constants";

const uri = Constants?.expoConfig?.hostUri
  ? `http://192.168.2.3:3000`
  : `missilewars.com`;

const axiosInstance = axios.create({
  baseURL: uri,
});

export default axiosInstance;
