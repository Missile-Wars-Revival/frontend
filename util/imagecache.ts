import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from '../util/firebase/config';
import { FirebaseError } from 'firebase/app';
import { Image } from 'react-native';

const DEFAULT_IMAGE = require('../assets/mapassets/Female_Avatar_PNG.png');

export const fetchAndCacheImage = async (username: string): Promise<string> => {
  const cacheKey = `profileImage_${username}`;
  
  try {
    // Try to get the image URL from cache
    const cachedUrl = await AsyncStorage.getItem(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    // If not in cache, fetch from Firebase
    const url = await firebase.storage().ref(`profileImages/${username}`).getDownloadURL();
    
    // Cache the URL
    await AsyncStorage.setItem(cacheKey, url);
    return url;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'storage/unauthorized') {
      console.log(`No profile image available for ${username}. Using default image.`);
    } else {
      console.error('Unexpected error when fetching image:', error);
    }
    // Return the default image URI for any error
    return Image.resolveAssetSource(DEFAULT_IMAGE).uri;
  }
};

export const preloadImages = (usernames: string[]) => {
  usernames.forEach(username => {
    fetchAndCacheImage(username).catch(() => {}); // Silently catch errors
  });
};