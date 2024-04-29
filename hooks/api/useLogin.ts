import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../../api/login";

export default function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      try {
        const response = await login(username, password);
        if (response.status === 200) {
          console.log("Login successful");
          alert("Login success!")
        } else {
          console.log("Invalid username or password");
          alert("Invalid username or password")
        }
        return response;
      } catch (error) {
        console.error("Error occurred during login:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
        refetchType: "active",
      });
    },
  });
}
