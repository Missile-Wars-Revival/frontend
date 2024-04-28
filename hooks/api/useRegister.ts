import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "../../api/register";

export default function useRegister(onSuccess?: () => void) {
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
    }) => register(username, email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
        refetchType: "active",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
  });
}
