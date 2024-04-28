import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dispatch } from "../../api/dispatch";

export default function useDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      username,
      password,
      latitude,
      longitude,
    }: {
      username: string;
      password: string;
      latitude: number;
      longitude: number;
    }) => dispatch(username, password, latitude, longitude),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["locations"],
        refetchType: "active",
      });
    },
  });
}
