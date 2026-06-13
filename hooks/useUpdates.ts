import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Updates from 'expo-updates';

export type UpdatePhase = 'checking' | 'downloading' | 'installing' | 'restarting';

type UseUpdatesOptions = {
  onOverlayChange?: (visible: boolean, phase: UpdatePhase | null) => void;
};

const INITIAL_CHECK_DELAY_MS = 3000;
const FOREGROUND_CHECK_COOLDOWN_MS = 20 * 60 * 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useUpdates({ onOverlayChange }: UseUpdatesOptions = {}) {
  const checkingRef = useRef(false);
  const reloadingRef = useRef(false);
  const lastCheckAtRef = useRef(0);
  const mountedRef = useRef(true);

  const setOverlay = useCallback((visible: boolean, phase: UpdatePhase | null) => {
    if (!mountedRef.current) return;
    onOverlayChange?.(visible, phase);
  }, [onOverlayChange]);

  const checkAndUpdate = useCallback(async ({ silent = true }: { silent?: boolean } = {}) => {
    if (__DEV__ || !Updates.isEnabled || checkingRef.current || reloadingRef.current) {
      return false;
    }

    checkingRef.current = true;
    lastCheckAtRef.current = Date.now();

    try {
      if (!silent) setOverlay(true, 'checking');

      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        setOverlay(false, null);
        return false;
      }

      setOverlay(true, 'downloading');
      const fetchResult = await Updates.fetchUpdateAsync();
      if (!fetchResult.isNew && !fetchResult.isRollBackToEmbedded) {
        setOverlay(false, null);
        return false;
      }

      setOverlay(true, 'installing');
      await wait(900);

      if (AppState.currentState !== 'active') {
        setOverlay(false, null);
        return true;
      }

      setOverlay(true, 'restarting');
      await wait(1200);

      reloadingRef.current = true;
      await Updates.reloadAsync({
        reloadScreenOptions: {
          backgroundColor: '#0E1020',
          spinner: {
            color: '#FFFFFF',
            size: 'large',
          },
        },
      });
      return true;
    } catch (error) {
      reloadingRef.current = false;
      console.error('Failed to apply OTA update:', error);
      setOverlay(false, null);
      return false;
    } finally {
      if (!reloadingRef.current) {
        checkingRef.current = false;
      }
    }
  }, [setOverlay]);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAndUpdate({ silent: true });
    }, INITIAL_CHECK_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [checkAndUpdate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      if (Date.now() - lastCheckAtRef.current < FOREGROUND_CHECK_COOLDOWN_MS) return;
      checkAndUpdate({ silent: true });
    });

    return () => subscription.remove();
  }, [checkAndUpdate]);

  return { checkAndUpdate };
}
