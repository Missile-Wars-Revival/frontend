import { NativeModules } from 'react-native';
import { config } from 'dotenv';

if (!NativeModules.ExpoConfig) {
  console.warn('No NativeModules.ExpoConfig found');
} else {
  const { manifest } = NativeModules.ExpoConfig;
  config({ path: manifest.extra?.dotenv });
}
