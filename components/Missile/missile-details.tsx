import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { getWeaponTypes, Product, getImages } from '../../api/store';
import { convertimestampfuturemissile } from '../../util/get-time-difference';
import { getPalette, Radius, Spacing, Type, cardShadow } from '../ui/theme';

const fallbackImage = require('../../assets/logo.png');

// Marker taps happen inside MapView, but react-native-maps does not reliably
// render non-map children (an RN Modal mounted under MapView never presents).
// So markers emit through this tiny event bus and MissileDetailsHost — mounted
// as a sibling of the MapView — owns the actual modal. Mirrors the
// game-effects bus pattern.

export type MissileDetails = {
  type: string;
  status: string;
  sentbyusername: string;
  etatimetoimpact: string;
  radius: number;
};

type Listener = (details: MissileDetails) => void;
const listeners = new Set<Listener>();

export function showMissileDetails(details: MissileDetails) {
  listeners.forEach((listener) => listener(details));
}

export function MissileDetailsHost() {
  const [details, setDetails] = useState<MissileDetails | null>(null);
  const [visible, setVisible] = useState(false);
  const [weapons, setWeapons] = useState<Product[]>([]);
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => fallbackImage);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const c = getPalette(isDarkMode);

  useEffect(() => {
    const listener: Listener = (incoming) => {
      setDetails(incoming);
      setVisible(true);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        const response = await getWeaponTypes();
        const mappedMissiles = response.missileTypes.map((missile: any) => ({
          id: missile.name,
          name: missile.name,
          type: 'Missiles',
          price: missile.price,
          image: missile.name,
          description: missile.description,
          speed: missile.speed,
          radius: missile.radius,
          damage: missile.damage,
          fallout: missile.fallout,
        }));
        setWeapons(mappedMissiles);
      } catch (error) {
        console.error('Error fetching weapons:', error);
      }
    };
    fetchWeapons();
  }, []);

  if (!details) {
    return null;
  }

  const missileDetails = weapons.find((weapon) => weapon.name === details.type) || null;
  const isIncoming = details.status?.startsWith('Incoming');
  const eta = details.etatimetoimpact
    ? convertimestampfuturemissile(details.etatimetoimpact).text
    : 'Unknown';

  const renderStatRow = (label: string, value: string, prominent = false) => (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
      <Text
        style={[
          prominent ? styles.statValueProminent : styles.statValue,
          { color: prominent ? c.text : c.textMuted },
        ]}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      statusBarTranslucent
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: c.overlay }]}
        onPress={() => setVisible(false)}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.modalCard, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}
        >
          <ScrollView bounces={false}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalImageWell, { backgroundColor: c.surfaceAlt }]}>
                <Image
                  source={getImageForProduct(details.type) || fallbackImage}
                  style={styles.modalImage}
                  contentFit="contain"
                />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: c.text }]}>
                  {details.type || 'Unknown Missile'}
                </Text>
                <Text style={[styles.modalPrice, { color: c.gold }]}>
                  🪙{missileDetails?.price ?? 'N/A'}
                </Text>
              </View>
            </View>

            <View style={[styles.statusChip, { backgroundColor: isIncoming ? c.dangerSoft : c.warningSoft }]}>
              <Text style={[styles.statusChipText, { color: isIncoming ? c.danger : c.warning }]}>
                {details.status || 'Unknown'}
              </Text>
            </View>

            {missileDetails?.description ? (
              <Text style={[styles.modalDescription, { color: c.textMuted }]}>
                {missileDetails.description}
              </Text>
            ) : null}

            <View style={[styles.statsContainer, { backgroundColor: c.surfaceAlt }]}>
              {renderStatRow('Sent by', details.sentbyusername || 'Unknown', true)}
              {renderStatRow('ETA', eta, true)}
              {renderStatRow('Speed', `${missileDetails?.speed ?? 'N/A'} m/s`)}
              {renderStatRow('Radius', `${details.radius || 'N/A'} m`)}
              {renderStatRow('Fallout', `${missileDetails?.fallout ?? 'N/A'} mins`)}
              {renderStatRow('Damage', `${missileDetails?.damage ?? 'N/A'} per 30s`)}
            </View>
          </ScrollView>
          <Pressable
            style={[styles.closeButton, { backgroundColor: c.accent }]}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  modalImageWell: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: 56,
    height: 56,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    ...Type.title,
  },
  modalPrice: {
    ...Type.headline,
    marginTop: Spacing.xs,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginBottom: Spacing.md,
  },
  statusChipText: {
    ...Type.caption,
  },
  modalDescription: {
    ...Type.body,
    marginBottom: Spacing.md,
  },
  statsContainer: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statLabel: {
    ...Type.caption,
  },
  statValue: {
    ...Type.body,
    flexShrink: 1,
    textAlign: 'right',
  },
  statValueProminent: {
    ...Type.headline,
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'right',
  },
  closeButton: {
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    ...Type.button,
    color: '#fff',
  },
});
