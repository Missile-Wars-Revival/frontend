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
        //console.log("Response from backend:", response);
        if (response.message === 'Login successful') { // Check message field instead of status code
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
