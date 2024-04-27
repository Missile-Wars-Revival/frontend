import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Constants from "expo-constants";

const uri = Constants?.expoConfig?.hostUri
  ? `http://` + Constants.expoConfig.hostUri.split(`:`).shift()?.concat(`:3000`)
  : `missilewars.com`;

async function dispatchLocation(
  username: string,
  latitude: number,
  longitude: number
) {
  try {
    const response = await axios.post(
      `${uri}/api/dispatch`,
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
