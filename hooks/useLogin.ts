import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function login(username: string, password: string) {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/login`,
      {
        username,
        password,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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