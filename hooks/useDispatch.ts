import { isAxiosError } from "axios";
import axiosInstance from "../api/axios-instance";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function dispatchLocation(
  username: string,
  latitude: number,
  longitude: number
) {
  try {
    const response = await axiosInstance.post("/api/dispatch", {
      username,
      latitude,
      longitude,
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      return error.response?.data;
    }
    console.error(error);
  }
}

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
