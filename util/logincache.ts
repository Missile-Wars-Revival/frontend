import * as SecureStore from 'expo-secure-store';

export const saveCredentials = async (username: string, password: string): Promise<void> => {
  try {
    // Store encrypted username and password
    await SecureStore.setItemAsync('username', username);
    await SecureStore.setItemAsync('password', password);
  } catch (error) {
    console.error('Error storing credentials securely:', error);
    throw error;
  }
};

export async function getCredentials() {
  try {
    const username = await SecureStore.getItemAsync('username');
    const password = await SecureStore.getItemAsync('password');

    if (username && password) {
      return { username, password };
    } else {
      // Handle the case where credentials are not found
      console.log('No credentials stored');
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch credentials', error);
    return null;
  }
}
