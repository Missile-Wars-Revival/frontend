import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeFriend } from "../../api/remove-friend";

export default function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      username,
      password,
      friend,
    }: {
      username: string;
      password: string;
      friend: string;
    }) => removeFriend(username, password, friend),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friends"],
        refetchType: "active",
      });
    },
  });
}
