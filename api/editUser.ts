import axiosInstance from "./axios-instance";
import { getSecureItemSafely } from "../util/secure-store";

export const editUser = async (username: string, updates: any) => {
  try {
    const token = await getSecureItemSafely("token");
    const response = await axiosInstance.post('/api/editUser', { token, username, updates });
    return response.data;
  } catch (error) {
    console.error('Error editing user:', error);
    throw error;
  }
};

const DEV_OFFLINE_TOKEN = 'dev-offline-token';

/**
 * Uploads a profile image through the backend, which converts it with sharp
 * (HEIC/odd formats -> JPEG) before storing it. Returns the stable image URL.
 */
export const uploadProfileImage = async (imageBase64: string): Promise<string> => {
  const token = await getSecureItemSafely("token");
  if (!token) throw new Error('No authentication token found');
  if (token === DEV_OFFLINE_TOKEN) throw new Error('Profile image upload unavailable offline');
  const response = await axiosInstance.post('/api/uploadProfileImage', { token, imageBase64 });
  return response.data.url;
};