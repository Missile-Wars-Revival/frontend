import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function registerUser(username: string, email: string, password: string) {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/register`,
      {
        username,
        email,
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

export default function useRegisterUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      username,
      email,
      password,
    }: {
      username: string;
      email: string;
      password: string;
    }) => registerUser(username, email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
        refetchType: "active",
      });
    },
  });
}
