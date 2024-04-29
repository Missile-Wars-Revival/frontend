import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../../api/login";

export default function useLogin(onSuccess?: () => void, onError?: () => void) {
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
      if (onSuccess) {
        alert("Login success!")
        onSuccess();
      }
    },
    onError: (error) => {
      console.error(error);
      alert("Login failed!")

      if (onError) {
        onError();
      }
    },
  });
}