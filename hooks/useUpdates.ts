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
  const lastCheckAtRef = useRef(0);

  const setOverlay = useCallback((visible: boolean, phase: UpdatePhase | null) => {
    onOverlayChange?.(visible, phase);
  }, [onOverlayChange]);

  const checkAndUpdate = useCallback(async ({ silent = true }: { silent?: boolean } = {}) => {
    if (__DEV__ || !Updates.isEnabled || checkingRef.current) {
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
      await Updates.fetchUpdateAsync();

      setOverlay(true, 'installing');
      await wait(900);

      setOverlay(true, 'restarting');
      await wait(700);

      await Updates.reloadAsync();
      return true;
    } catch (error) {
      console.error('Failed to apply OTA update:', error);
      setOverlay(false, null);
      return false;
    } finally {
      checkingRef.current = false;
    }
  }, [setOverlay]);

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
