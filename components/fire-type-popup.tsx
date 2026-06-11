import React, { useState, useEffect, useRef } from "react";
import { Modal, View, Text, Pressable, StyleSheet, useColorScheme, Dimensions, Animated, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from '@react-native-vector-icons/ionicons';
import { useOnboarding } from '../util/Context/onboardingContext';
import { PressableScale } from './ui/PressableScale';
import { getPalette, Gradients, Radius, Spacing, Type, cardShadow, chipShadow } from './ui/theme';

const { width } = Dimensions.get('window');

type GradientColors = readonly [string, string, ...string[]];

const ACTIONS: {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  colors: GradientColors;
}[] = [
  { id: 'firelandmine', label: 'Place Landmine', icon: 'radio-button-on', colors: Gradients.gold },
  { id: 'firemissile', label: 'Fire Missile', icon: 'rocket', colors: Gradients.fire },
  { id: 'lootdrop', label: 'Request Loot Drop', icon: 'gift', colors: ['#F7B733', '#FC4A1A'] },
  { id: 'other', label: 'Place Special Items', icon: 'sparkles-outline', colors: Gradients.brand },
];

interface FireTypeProps {
  landmineFireHandler: () => void;
  missileFireHandler: () => void;
  lootrequesthandler: () => void;
  otherrequesthandler: () => void;
}

export const FireType = (props: FireTypeProps) => {
  const [FirepopupVisible, setFirePopupVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const c = getPalette(isDarkMode);
  const { currentStep, moveToNextStep } = useOnboarding();

  const FireshowPopup = () => {
    setFirePopupVisible(true);
    if (currentStep === 'fire') {
      moveToNextStep();
    }
  };

  const FireclosePopup = () => {
    setFirePopupVisible(false);
  };

  const pendingActionRef = useRef<string | null>(null);

  const runPendingAction = () => {
    const style = pendingActionRef.current;
    pendingActionRef.current = null;
    if (!style) return;

    switch (style) {
      case "firelandmine":
        props.landmineFireHandler();
        break;
      case "firemissile":
        props.missileFireHandler();
        break;
      case "lootdrop":
        props.lootrequesthandler();
        break;
      case "other":
        props.otherrequesthandler();
        break;
      default:
        break;
    }
  };

  const selectFiretype = (style: string) => {
    if (style === "firelandmine" && currentStep === 'fire_landmine') {
      moveToNextStep();
    }

    pendingActionRef.current = style;
    FireclosePopup();

    if (Platform.OS !== 'ios') {
      runPendingAction();
    }
  };

  return (
    <View>
      <PressableScale
        style={[styles.fireButton, chipShadow(isDarkMode)]}
        onPress={FireshowPopup}
        haptic="tap"
        pressedScale={0.9}
      >
        <LinearGradient colors={Gradients.fire} style={styles.fireButtonFill}>
          <Ionicons name="flame" size={26} color="#fff" />
        </LinearGradient>
      </PressableScale>

      <FireTypeStyle
        visible={FirepopupVisible}
        transparent={true}
        onClose={FireclosePopup}
        onDismissed={runPendingAction}
        onSelect={selectFiretype}
        isDarkMode={isDarkMode}
        c={c}
      />
    </View>
  )
};


interface MapStylePopupProps {
  visible: boolean;
  transparent: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  onSelect: (style: string) => void;
  isDarkMode: boolean;
  c: ReturnType<typeof getPalette>;
}

export const FireTypeStyle = ({
  visible,
  transparent,
  onClose,
  onDismissed,
  onSelect,
  isDarkMode,
  c,
}: MapStylePopupProps) => {
  const [slideAnim] = useState(() => new Animated.Value(300));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleActionPress = (action: string) => {
    onSelect(action);
  };

  return (
    <Modal
      animationType="fade"
      transparent={transparent}
      visible={visible}
      onRequestClose={onClose}
      onDismiss={onDismissed}
    >
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: c.overlay }]}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.modalContentWrapper,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContent,
              { backgroundColor: c.surface },
              cardShadow(isDarkMode),
            ]}
          >
            <Text style={[styles.modalTitle, { color: c.text }]}>Select Action</Text>
            <Text style={[styles.modalSubtitle, { color: c.textMuted }]}>
              Choose what to deploy on the map
            </Text>

            {ACTIONS.map((action) => (
              <PressableScale
                key={action.id}
                onPress={() => handleActionPress(action.id)}
                style={[styles.actionButton, { backgroundColor: c.surfaceAlt }]}
                haptic="select"
                pressedScale={0.97}
              >
                <LinearGradient colors={action.colors} style={styles.iconChip}>
                  <Ionicons name={action.icon} size={22} color="#fff" />
                </LinearGradient>
                <Text style={[styles.actionText, { color: c.text }]}>{action.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
              </PressableScale>
            ))}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fireButton: {
    position: 'absolute',
    bottom: 0,
    left: width * 0.05,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#F5365C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fireButtonFill: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
  },
  modalContentWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: '92%',
    maxWidth: 400,
  },
  modalTitle: {
    ...Type.title,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    ...Type.caption,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    ...Type.headline,
    flex: 1,
  },
});