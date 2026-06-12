import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import { auth, createUserWithEmailAndPassword } from "../util/firebase/firebaseAuth";
import { setBackgroundAccessibleItem } from "../util/secure-store";

export async function register(
  username: string,
  email: string,
  password: string,
  notificationToken: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setBackgroundAccessibleItem("firebaseUID", userCredential.user.uid);
    const idToken = await userCredential.user.getIdToken();
    const response = await axiosInstance.post("/api/register", { idToken, username, notificationToken });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? error.response?.data ?? "Registration failed");
    }
    throw error;
  }
}
