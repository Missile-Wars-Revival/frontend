import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function dispatchLocation(
  username: string,
  latitude: number,
  longitude: number
) {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/dispatch`,
      {
        username,
        latitude,
        longitude,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
