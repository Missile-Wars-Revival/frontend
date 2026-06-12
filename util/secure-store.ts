import * as SecureStore from 'expo-secure-store';

export const BACKGROUND_ACCESSIBLE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export async function setBackgroundAccessibleItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, BACKGROUND_ACCESSIBLE_OPTIONS);
}

export async function getSecureItemSafely(
  key: string,
  options?: SecureStore.SecureStoreOptions,
): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key, options);
  } catch (error) {
    console.log(`SecureStore read skipped for ${key}:`, error);
    return null;
  }
}
