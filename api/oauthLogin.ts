import axiosInstance from './axios-instance';
import { isAxiosError } from 'axios';

export async function oauthLogin(
  firebaseUID: string,
  email: string,
  displayName: string,
  notificationToken: string,
): Promise<{ token: string; username: string }> {
  try {
    const response = await axiosInstance.post('/api/oauth-login', {
      firebaseUID,
      email,
      displayName,
      notificationToken,
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'OAuth login failed');
    }
    throw error;
  }
}
