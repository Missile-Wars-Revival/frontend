import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../../api/login";

export default function useLogin(
  onSuccess?: (token: string) => void,
  onError?: () => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      username,
      password,
      notificationToken,
    }: {
      username: string;
      password: string;
      notificationToken: string;
    }) => login(username, password, notificationToken),
    onSuccess: (data) => {
      const token = data.token; // Assuming the token is returned in the `data` object
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
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
