import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "../../api/register";

export default function useRegister(
  onSuccess?: (token: string) => void,
  onError?: () => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      username,
      email,
      password,
      notificationToken,
    }: {
      username: string;
      email: string;
      password: string;
      notificationToken: string;
    }) => register(username, email, password, notificationToken),
    onSuccess: (data) => {
      const token = data.token; // Assuming the token is returned in the `data` object
      queryClient.invalidateQueries({
        queryKey: ["users"],
        refetchType: "active",
      });

      if (onSuccess) {
        onSuccess(token);
      }
    },
    onError: (error) => {
      console.error(error);

      if (onError) {
        onError();
      }
    },
  });
}