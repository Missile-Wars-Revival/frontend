import { useQuery } from "@tanstack/react-query";
import { nearby } from "../../api/nearby";

export default function useNearby(
  username: string,
  latitude: number,
  longitude: number
) {
  return useQuery({
    queryKey: ["nearby"],
    queryFn: () => nearby(username, latitude, longitude),
  });
}
