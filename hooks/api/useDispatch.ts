import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dispatchLocation } from "../../api/dispatch-location";

export default function useDispatchLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      username,
      latitude,
      longitude,
    }: {
      username: string;
      latitude: number;
      longitude: number;
    }) => dispatchLocation(username, latitude, longitude),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["locations"],
        refetchType: "active",
      });
    },
  });
}
