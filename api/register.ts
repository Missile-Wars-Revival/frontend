import { isAxiosError, AxiosError } from "axios";
import axiosInstance from "./axios-instance";

export async function register(
  username: string,
  email: string,
  password: string
) {
  try {
    const response = await axiosInstance.post("/api/register", {
      username,
      email,
      password,
    });

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.log("Axios error:", axiosError.message);
      if (axiosError.response) {
        console.log("Status:", axiosError.response.status);
        console.log("Data:", axiosError.response.data);

        // Type assertion to specify the type of axiosError.response.data
        const responseData = axiosError.response.data as { message: string };

        // Check if the error message matches the specified message
        if (
          responseData.message === "Password must be at least 8 characters long"
        ) {
          alert("Password must be at least 8 characters long");
        }

        if (responseData.message === "User already exists") {
          alert("A user with this email or username already exists!");
        }

        if (responseData.message === "Invalid email address") {
          alert("Enter a valid email address!");
        }

        return responseData;
      }
    } else {
      console.log("Non-Axios error:");
    }
    throw error; // Rethrow the error to handle it in the mutation hook
  }
}
