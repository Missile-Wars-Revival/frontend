import axios, { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function login(username: string, password: string) {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BACKEND_URL}:3000/api/login`,
      {
        username,
        password,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.log("Axios error:", axiosError.message);
      if (axiosError.response) {
        console.log("Status:", axiosError.response.status);
        console.log("Data:", axiosError.response.data);
        return axiosError.response.data;
      }
    } else {
      console.log("Non-Axios error:");
    }
    throw error; // Rethrow the error to handle it in the mutation hook
  }
}

export default function useLogin(onSuccess: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      try {
        const data = await login(username, password);
        return data;
      } catch (error) {
        console.log("Login failed:");
        throw error; // Rethrow the error to handle it in the mutation hook
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
        refetchType: "active",
      });
      onSuccess();
    },
    onError: (error) => {
      console.log("Mutation error:", error.message);
    },
  });
}
