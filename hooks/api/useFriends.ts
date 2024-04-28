import { useQuery } from "@tanstack/react-query";
import { friends } from "../../api/friends";

export default function useFriends(username: string, password: string) {
  return useQuery({
    queryKey: ["friends"],
    queryFn: () => friends(username, password),
  });
}
