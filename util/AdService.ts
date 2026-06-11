import { Platform } from 'react-native';
import mobileAds, {
  AdsConsent,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import NetInfo from '@react-native-community/netinfo';
import Purchases from 'react-native-purchases';
import { AD_UNIT_IDS, INTERSTITIAL_FREQUENCY, REWARDED_AD_CONFIG } from '@/constants/AdConfig';

const AD_FREE_ENTITLEMENT_KEYS = ['ad_free', 'adfree', 'no_ads'];

/**
 * Centralized ad management.
 *
 * Call `AdService.initialize()` once at app startup (only on native).
 * Interstitial lifecycle is fully managed here with frequency capping.
 */
class AdServiceSingleton {
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private interstitial: InterstitialAd | null = null;
  private interstitialReady = false;
  private lastInterstitialShown = 0;
  private qualifyingActionCount = 0;
  private unsubscribers: (() => void)[] = [];

  // Rewarded ad state
  private rewarded: RewardedAd | null = null;
  private rewardedReady = false;
  private rewardedUnsubscribers: (() => void)[] = [];
  private lastRewardedShown = 0;
  private rewardedCountToday = 0;
  private rewardedDayKey = '';
  private onRewardedLoadedCallback: (() => void) | null = null;
  private netInfoUnsubscribe: (() => void) | null = null;
  private interstitialRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private rewardedRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private interstitialRetryCount = 0;
  private rewardedRetryCount = 0;
  private lifecycleToken = 0;

  // Exponential backoff schedule: 30s → 60s → 120s → 300s, capped at 4 retries.
  private static readonly RETRY_BACKOFF_MS = [30_000, 60_000, 120_000, 300_000];
  private static readonly MAX_RETRIES = AdServiceSingleton.RETRY_BACKOFF_MS.length;

  private getBackoffDelay(retryCount: number): number {
    const idx = Math.min(retryCount, AdServiceSingleton.RETRY_BACKOFF_MS.length - 1);
    const delay = AdServiceSingleton.RETRY_BACKOFF_MS[idx];
    return delay !== undefined ? delay : AdServiceSingleton.RETRY_BACKOFF_MS[AdServiceSingleton.RETRY_BACKOFF_MS.length - 1]!;
  }

  /** Whether the AdMob SDK has been successfully initialized. */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /** Check if the current user has purchased an ad-free entitlement via RevenueCat. */
  private async hasAdFreeEntitlement(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const active = Object.keys(customerInfo.entitlements.active ?? {}).map(k => k.toLowerCase());
      return active.some(key => AD_FREE_ENTITLEMENT_KEYS.includes(key));
    } catch {
      return false;
    }
  }

  /** Returns a promise that resolves when the SDK is ready. */
  whenReady(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    // SDK not yet initializing — resolve immediately so callers don't hang
    return Promise.resolve();
  }

  // ── SDK bootstrap ───────────────────────────────────────────────────────
  async initialize(): Promise<void> {
    if (this.initialized || Platform.OS === 'web') return;
    if (this.initPromise) return this.initPromise;

    // Start the reconnect listener immediately so that if SDK init fails on
    // cold start (network not ready), we automatically retry when online.
    this.listenForReconnect();
    const token = this.lifecycleToken;

    this.initPromise = (async () => {
      try {
        // Gather UMP consent — shows the consent form for EEA/UK users if needed.
        // For non-EEA users this resolves immediately without showing any UI.
        let noFormConfigured = false;
        const tryGatherConsent = async (): Promise<boolean> => {
          try {
            await AdsConsent.gatherConsent();
            return true;
          } catch (e) {
            const msg: string = (e as any)?.message ?? String(e);
            if (msg.includes('no form')) {
              // AdMob Privacy & messaging consent form not configured yet.
              noFormConfigured = true;
              return false;
            }
            if (msg.includes('view controller')) {
              // iOS: another VC is presenting (e.g. splash screen). Caller will retry.
              throw e;
            }
            console.warn('⚠️ AdMob consent gathering failed:', e);
            return false;
          }
        };

        // First attempt — may fail if the splash/root VC is still presenting.
        try {
          await tryGatherConsent();
        } catch {
          // VC conflict: wait for the initial presentation to settle then retry.
          await new Promise<void>(resolve => setTimeout(resolve, 1000));
          if (token !== this.lifecycleToken) return;
          try {
            await tryGatherConsent();
          } catch (retryError) {
            console.warn('⚠️ AdMob consent gathering failed after retry:', retryError);
          }
        }

        if (token !== this.lifecycleToken) return;

        const { canRequestAds } = await AdsConsent.getConsentInfo();
        if (!canRequestAds) {
          if (noFormConfigured) {
            console.warn(' AdMob: consent required but no form configured — create one at apps.admob.com → Privacy & messaging');
          } else {
            console.log(' AdMob: consent not granted, skipping initialization');
          }
          this.initPromise = null;
          return;
        }

        await mobileAds().initialize();
        if (token !== this.lifecycleToken) return;
        this.initialized = true;
        console.log('✅ AdMob SDK initialized');
        this.loadInterstitial();
        this.loadRewarded();
      } catch (error) {
        if (token !== this.lifecycleToken) return;
        console.warn('⚠️ AdMob initialization failed:', error);
        // Reset so the next call to initialize() (e.g. from reconnect
        // listener) can actually retry instead of returning this failed promise.
        this.initPromise = null;
        // The reconnect listener only retries when the device goes offline then
        // comes back online (wasOffline gate). If the device was online the
        // whole time but the SDK init failed (e.g. transient DNS failure,
        // AdMob servers temporarily unreachable), the reconnect path is never
        // triggered. Schedule a standalone retry so we recover in that case.
        this.cancelInterstitialRetry();
        this.interstitialRetryTimer = setTimeout(() => {
          if (token === this.lifecycleToken && !this.initialized) {
            this.initialize();
          }
        }, 30_000);
      }
    })();

    return this.initPromise;
  }

  // ── Network reconnect listener ──────────────────────────────────────────
  // When the device comes back online, immediately attempt to load any ads
  // that aren't already loaded, instead of waiting for the blind 30s retry.
  // Also retries SDK initialization if it failed on cold start.
  private listenForReconnect(): void {
    if (this.netInfoUnsubscribe) return;

    let wasOffline = false;
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      if (!online) {
        wasOffline = true;
        return;
      }
      if (wasOffline) {
        wasOffline = false;

        // If the SDK itself failed to init (e.g. cold start with no network),
        // retry the entire initialization sequence.
        if (!this.initialized) {
          this.initialize();
          return;
        }

        // SDK is initialized but ads failed to load — reload immediately
        if (!this.interstitialReady) {
          this.cancelInterstitialRetry();
          this.interstitialRetryCount = 0; // Reset cap on reconnect
          this.loadInterstitial();
        }
        if (!this.rewardedReady) {
          this.cancelRewardedRetry();
          this.rewardedRetryCount = 0; // Reset cap on reconnect
          this.loadRewarded();
        }
      }
    });
  }

  private cancelInterstitialRetry(): void {
    if (this.interstitialRetryTimer) {
      clearTimeout(this.interstitialRetryTimer);
      this.interstitialRetryTimer = null;
    }
  }

  private cancelRewardedRetry(): void {
    if (this.rewardedRetryTimer) {
      clearTimeout(this.rewardedRetryTimer);
      this.rewardedRetryTimer = null;
    }
  }

  private async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected === false) return false;
      if (state.isInternetReachable === false) return false;
      return true;
    } catch {
      // If NetInfo fails, assume online so we don't permanently block retries.
      return true;
    }
  }

  // ── Interstitial ────────────────────────────────────────────────────────
  private loadInterstitial(): void {
    if (!this.initialized) return;
    const token = this.lifecycleToken;

    // Clean up previous listeners
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    this.interstitialReady = false;
    this.interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);

    const onLoaded = this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      if (token !== this.lifecycleToken) return;
      this.interstitialReady = true;
      this.interstitialRetryCount = 0; // Reset backoff on successful load
    });
    const onClosed = this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      if (token !== this.lifecycleToken) return;
      this.interstitialReady = false;
      // Pre-load the next interstitial after the current one closes
      this.loadInterstitial();
    });
    const onError = this.interstitial.addAdEventListener(AdEventType.ERROR, () => {
      if (token !== this.lifecycleToken) return;
      this.interstitialReady = false;
      this.cancelInterstitialRetry();
      if (this.interstitialRetryCount >= AdServiceSingleton.MAX_RETRIES) {
        console.log(' Interstitial retry cap reached — waiting for network reconnect');
        return;
      }
      // Exponential backoff — the reconnect listener also retriggers immediately
      // when the device comes back online.
      const delay = this.getBackoffDelay(this.interstitialRetryCount);
      this.interstitialRetryCount += 1;
      const retryToken = token;
      this.interstitialRetryTimer = setTimeout(async () => {
        if (retryToken !== this.lifecycleToken) return;
        if (await this.isOnline()) {
          if (retryToken !== this.lifecycleToken) return;
          this.loadInterstitial();
        }
      }, delay);
    });

    this.unsubscribers.push(onLoaded, onClosed, onError);
    this.interstitial.load();
  }

  /**
   * Record a qualifying user action (e.g. ending an event, navigating back
   * from event details).  After enough actions the next call to
   * `showInterstitialIfReady()` will actually display the ad.
   */
  recordQualifyingAction(): void {
    this.qualifyingActionCount += 1;
  }

  /**
   * Show an interstitial ad **only** if all frequency-cap conditions are met.
   *
   * Returns `true` if the ad was shown, `false` otherwise.
   */
  async showInterstitialIfReady(): Promise<boolean> {
    if (!this.initialized || !this.interstitialReady || !this.interstitial) {
      return false;
    }

    // Paid users with ad-free entitlement never see interstitials
    if (await this.hasAdFreeEntitlement()) {
      return false;
    }

    // Respect the minimum action count before first impression
    if (this.qualifyingActionCount < INTERSTITIAL_FREQUENCY.actionsBeforeFirst) {
      return false;
    }

    // Respect the minimum interval between impressions
    const now = Date.now();
    if (now - this.lastInterstitialShown < INTERSTITIAL_FREQUENCY.minIntervalMs) {
      return false;
    }

    try {
      await this.interstitial.show();
      this.lastInterstitialShown = Date.now();
      return true;
    } catch {
      return false;
    }
  }

  // ── Rewarded Ad ─────────────────────────────────────────────────────────
  private loadRewarded(): void {
    if (!this.initialized) return;
    const token = this.lifecycleToken;

    this.rewardedUnsubscribers.forEach((unsub) => unsub());
    this.rewardedUnsubscribers = [];

    this.rewardedReady = false;
    this.rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);

    const onLoaded = this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (token !== this.lifecycleToken) return;
      this.rewardedReady = true;
      this.rewardedRetryCount = 0; // Reset backoff on successful load
      this.onRewardedLoadedCallback?.();
    });
    const onClosed = this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      if (token !== this.lifecycleToken) return;
      this.rewardedReady = false;
      this.loadRewarded();
    });
    const onError = this.rewarded.addAdEventListener(AdEventType.ERROR, () => {
      if (token !== this.lifecycleToken) return;
      this.rewardedReady = false;
      this.cancelRewardedRetry();
      if (this.rewardedRetryCount >= AdServiceSingleton.MAX_RETRIES) {
        console.log(' Rewarded retry cap reached — waiting for network reconnect');
        return;
      }
      const delay = this.getBackoffDelay(this.rewardedRetryCount);
      this.rewardedRetryCount += 1;
      const retryToken = token;
      this.rewardedRetryTimer = setTimeout(async () => {
        if (retryToken !== this.lifecycleToken) return;
        if (await this.isOnline()) {
          if (retryToken !== this.lifecycleToken) return;
          this.loadRewarded();
        }
      }, delay);
    });

    this.rewardedUnsubscribers.push(onLoaded, onClosed, onError);
    this.rewarded.load();
  }

  /** Whether a rewarded ad is loaded and within daily/cooldown limits. */
  get isRewardedReady(): boolean {
    if (!this.initialized || !this.rewardedReady || !this.rewarded) return false;

    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.rewardedDayKey) {
      this.rewardedDayKey = today;
      this.rewardedCountToday = 0;
    }

    if (this.rewardedCountToday >= REWARDED_AD_CONFIG.maxPerDay) return false;
    if (Date.now() - this.lastRewardedShown < REWARDED_AD_CONFIG.minIntervalMs) return false;

    return true;
  }

  /** Remaining rewarded ads the user can watch today. */
  get rewardedAdsRemainingToday(): number {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.rewardedDayKey) {
      this.rewardedDayKey = today;
      this.rewardedCountToday = 0;
    }
    return Math.max(0, REWARDED_AD_CONFIG.maxPerDay - this.rewardedCountToday);
  }

  /**
   * Show a rewarded video ad. Returns `true` if the user watched the full ad
   * and earned the reward, `false` otherwise.
   */
  showRewarded(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isRewardedReady || !this.rewarded) {
        resolve(false);
        return;
      }

      let earned = false;

      const onEarned = this.rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          this.lastRewardedShown = Date.now();
          this.rewardedCountToday += 1;
          earned = true;
        }
      );

      // Wait for CLOSED before resolving — the ad UI is still visible until
      // this fires, so resolving earlier causes the app to appear frozen.
      const onClosed = this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        cleanup();
        resolve(earned);
      });

      const cleanup = () => {
        onEarned();
        onClosed();
      };

      this.rewarded.show().catch(() => {
        cleanup();
        resolve(false);
      });
    });
  }

  /** Register a callback to be invoked when a rewarded ad finishes loading. */
  setOnRewardedLoaded(callback: (() => void) | null): void {
    this.onRewardedLoadedCallback = callback;
  }

  // ── Teardown ────────────────────────────────────────────────────────────
  destroy(): void {
    this.lifecycleToken += 1;
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.interstitial = null;
    this.interstitialReady = false;
    this.lastInterstitialShown = 0;
    this.qualifyingActionCount = 0;
    this.rewardedUnsubscribers.forEach((unsub) => unsub());
    this.rewardedUnsubscribers = [];
    this.rewarded = null;
    this.rewardedReady = false;
    this.lastRewardedShown = 0;
    this.rewardedCountToday = 0;
    this.rewardedDayKey = '';
    this.onRewardedLoadedCallback = null;
    this.initialized = false;
    this.initPromise = null;
    this.interstitialRetryCount = 0;
    this.rewardedRetryCount = 0;
    this.cancelInterstitialRetry();
    this.cancelRewardedRetry();
    this.netInfoUnsubscribe?.();
    this.netInfoUnsubscribe = null;
  }
}

const AdService = new AdServiceSingleton();
export default AdService;
