import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerUser } from "../../api/register-user";

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
