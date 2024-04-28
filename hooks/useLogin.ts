import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import axiosInstance from "../api/axios-instance";

export async function login(username: string, password: string) {
  try {
    const response = await axiosInstance.post("/api/login", {
      username,
      password,
    });

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      return error.response?.data;
    }

    console.log(error);
  }
}

export default function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => login(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
        refetchType: "active",
      });
    },
  });
}
