import { useQuery } from "@tanstack/react-query";
import { testUsers } from "../../api/test-users";

export default function useTestUsers() {
  return useQuery({
    queryKey: ["test-users"],
    queryFn: () => testUsers(),
  });
}
