import axios from "axios";
import Constants from "expo-constants";

const uri = Constants?.expoConfig?.hostUri
  ? `http://` + Constants.expoConfig.hostUri.split(`:`).shift()?.concat(`:3000`)
  : `missilewars.com`;

const axiosInstance = axios.create({
  baseURL: uri,
});

export default axiosInstance;