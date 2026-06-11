import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapStyle } from '../types/types';
import { androidDefaultMapStyle } from '../map-themes/Android-themes/defaultMapStyle';
import { androidRadarMapStyle } from '../map-themes/Android-themes/radarMapStyle';
import { androidCherryBlossomMapStyle } from '../map-themes/Android-themes/cherryBlossomMapStyle';
import { androidCyberpunkMapStyle } from '../map-themes/Android-themes/cyberpunkstyle';
import { androidColorblindMapStyle } from '../map-themes/Android-themes/colourblindstyle';
import {
  IOSCherryBlossomMapStyle,
  IOSColorblindMapStyle,
  IOSCyberpunkMapStyle,
  IOSDefaultMapStyle,
  IOSRadarMapStyle,
} from '../map-themes/IOS-themes/themestemp';

const defaultMapStyle = Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle;

const namedStyles: Record<string, MapStyle[]> = {
  default: defaultMapStyle,
  radar: Platform.OS === 'android' ? androidRadarMapStyle : IOSRadarMapStyle,
  cherry: Platform.OS === 'android' ? androidCherryBlossomMapStyle : IOSCherryBlossomMapStyle,
  cyber: Platform.OS === 'android' ? androidCyberpunkMapStyle : IOSCyberpunkMapStyle,
  colourblind: Platform.OS === 'android' ? androidColorblindMapStyle : IOSColorblindMapStyle,
};

// Resolves the user's stored map theme ("selectedMapStyle" in AsyncStorage,
// either a named theme or a raw style JSON array) to the platform style.
export function useStoredMapStyle(): MapStyle[] {
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle[]>(defaultMapStyle);

  useEffect(() => {
    const loadStoredMapStyle = async () => {
      try {
        const storedStyle = await AsyncStorage.getItem('selectedMapStyle');
        if (!storedStyle) return;

        const namedStyle = namedStyles[storedStyle];
        if (namedStyle) {
          setCurrentMapStyle(namedStyle);
        } else {
          setCurrentMapStyle(JSON.parse(storedStyle) as MapStyle[]);
        }
      } catch (error) {
        console.error('Error loading stored map style:', error);
        setCurrentMapStyle(defaultMapStyle);
      }
    };

    loadStoredMapStyle();
  }, []);

  return currentMapStyle;
}
