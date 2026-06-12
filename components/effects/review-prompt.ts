import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameEffectType } from './game-effects';

const REVIEW_PROMPT_ACTION_COUNT_KEY = 'reviewPromptActionCount';
const REVIEW_PROMPT_LAST_SHOWN_KEY = 'reviewPromptLastShownAt';
const REVIEW_PROMPT_COMPLETED_KEY = 'reviewPromptCompleted';

const ELIGIBLE_EFFECTS = new Set<GameEffectType>([
  'missileLaunch',
  'landmineArm',
  'lootDrop',
  'shieldUp',
  'purchaseSuccess',
  'checkoutSuccess',
]);

const ACTIONS_BEFORE_PROMPT = 4;
const PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

type Listener = () => void;

const listeners = new Set<Listener>();

export function onReviewPrompt(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function markReviewPromptCompleted() {
  await AsyncStorage.setItem(REVIEW_PROMPT_COMPLETED_KEY, 'true');
  await AsyncStorage.setItem(REVIEW_PROMPT_LAST_SHOWN_KEY, String(Date.now()));
}

export async function markReviewPromptDismissed() {
  await AsyncStorage.setItem(REVIEW_PROMPT_LAST_SHOWN_KEY, String(Date.now()));
}

export async function maybePromptForReviewAfterEffect(type: GameEffectType) {
  try {
    if (!ELIGIBLE_EFFECTS.has(type)) return;

    const completed = await AsyncStorage.getItem(REVIEW_PROMPT_COMPLETED_KEY);
    if (completed === 'true') return;

    const lastShownRaw = await AsyncStorage.getItem(REVIEW_PROMPT_LAST_SHOWN_KEY);
    const lastShown = lastShownRaw ? Number(lastShownRaw) : 0;
    if (Number.isFinite(lastShown) && Date.now() - lastShown < PROMPT_COOLDOWN_MS) return;

    const countRaw = await AsyncStorage.getItem(REVIEW_PROMPT_ACTION_COUNT_KEY);
    const nextCount = (countRaw ? Number(countRaw) : 0) + 1;
    if (nextCount < ACTIONS_BEFORE_PROMPT) {
      await AsyncStorage.setItem(REVIEW_PROMPT_ACTION_COUNT_KEY, String(nextCount));
      return;
    }

    await AsyncStorage.setItem(REVIEW_PROMPT_ACTION_COUNT_KEY, '0');
    listeners.forEach((listener) => listener());
  } catch (error) {
    console.error('Failed to evaluate review prompt:', error);
  }
}
