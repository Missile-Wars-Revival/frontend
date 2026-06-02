import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Purchases from 'react-native-purchases';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const parseEntitlementKeys = () => {
  const configured = process.env.EXPO_PUBLIC_REVENUECAT_AD_FREE_ENTITLEMENTS;
  const fallback = 'ad_free,adfree,no_ads';
  return (configured ?? fallback)
    .split(',')
    .map((key) => key.trim().toLowerCase())
    .filter(Boolean);
};

const getBannerUnitId = () => {
  if (__DEV__) {
    return TestIds.BANNER;
  }

  const iosUnit = process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS;
  const androidUnit = process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID;

  if (Platform.OS === 'ios') {
    return iosUnit || TestIds.BANNER;
  }

  return androidUnit || TestIds.BANNER;
};

const AdBanner: React.FC = () => {
  const [showAds, setShowAds] = useState(false);
  const [nonPersonalizedAdsOnly, setNonPersonalizedAdsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const entitlementKeys = useMemo(parseEntitlementKeys, []);

  useEffect(() => {
    let isMounted = true;

    const loadAdPolicy = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const activeEntitlements = Object.keys(customerInfo.entitlements.active ?? {}).map((key) => key.toLowerCase());
        const hasAdFree = activeEntitlements.some((key) => entitlementKeys.includes(key));

        let shouldUseNonPersonalizedAds = false;
        if (Platform.OS === 'ios') {
          const tracking = await TrackingTransparency.getTrackingPermissionsAsync();
          shouldUseNonPersonalizedAds = tracking.status !== 'granted';
        }

        if (isMounted) {
          setShowAds(!hasAdFree);
          setNonPersonalizedAdsOnly(shouldUseNonPersonalizedAds);
        }
      } catch (error) {
        console.warn('Ad policy check failed, defaulting to ads enabled:', error);
        if (isMounted) {
          setShowAds(true);
          setNonPersonalizedAdsOnly(Platform.OS === 'ios');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAdPolicy();

    return () => {
      isMounted = false;
    };
  }, [entitlementKeys]);

  if (loading || !showAds) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={getBannerUnitId()}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: nonPersonalizedAdsOnly }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});

export default AdBanner;
