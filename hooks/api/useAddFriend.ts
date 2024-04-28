import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFriend } from "../../api/add-friend";

export default function useAddFriend() {
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
    }) => addFriend(username, password, friend),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friends"],
        refetchType: "active",
      });
    },
  });
}
