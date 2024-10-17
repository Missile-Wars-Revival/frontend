import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { getCurrentLocation, getlocation } from '../util/locationreq';
import { WebSocketMessage, WSMsg } from 'middle-earth';
import useWebSocket from './websockets/websockets';

export const useLocationUpdates = () => {
  const { sendWebsocket } = useWebSocket();
  const lastUpdateTimeRef = useRef<number>(0);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const updateAndSendLocation = useCallback(async () => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 25000) {
    //   console.log('Skipping update, too soon since last update');
      return;
    }

    try {
      const newLocation = await getCurrentLocation();
      getlocation();
      if (newLocation) {
        const locationData = {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude
        };

        const locationMsg = new WSMsg("playerLocation", locationData);
        const message = new WebSocketMessage([locationMsg]);
        console.log('Sending location update:', JSON.stringify(message));
        sendWebsocket(message);

        lastUpdateTimeRef.current = now;
        console.log('Location update sent successfully');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [sendWebsocket]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        updateAndSendLocation();
      }
      appStateRef.current = nextAppState;
    });

    updateAndSendLocation();

    updateIntervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        console.log('Interval triggered, calling updateAndSendLocation');
        updateAndSendLocation();
      }
    }, 30000);

    return () => {
      subscription.remove();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [updateAndSendLocation]);
};
