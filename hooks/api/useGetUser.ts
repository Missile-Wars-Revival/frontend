import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../api/get-user";

export default function useGetUser(username: string) {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(username),
  });
}
