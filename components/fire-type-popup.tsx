import React, { useState, useEffect, useRef } from "react";
import { Modal, View, Text, Pressable, StyleSheet, useColorScheme, Dimensions, Animated, Platform } from "react-native";
import Ionicons from '@react-native-vector-icons/ionicons';
import { useOnboarding } from '../util/Context/onboardingContext';
import { PressableScale } from './ui/PressableScale';

const { width, height } = Dimensions.get('window');

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
  const { currentStep, moveToNextStep, isOnboardingComplete } = useOnboarding();

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

    // Always close this selector before opening another sheet.
    // This avoids stale visibility state after swipe-dismiss or navigation.
    pendingActionRef.current = style;
    FireclosePopup();

    // iOS can only run one modal transition at a time: presenting the native
    // bottom sheet while this modal is still dismissing silently fails, so the
    // action is deferred to the modal's onDismiss. Android windows don't
    // conflict, so open the next sheet immediately.
    if (Platform.OS !== 'ios') {
      runPendingAction();
    }
  };

  return (
    <View>
      <PressableScale
        style={[styles.fireButton, isDarkMode && styles.fireButtonDark]}
        onPress={FireshowPopup}
        haptic="tap"
        pressedScale={0.9}
      >
        <Ionicons name="flame" size={24} color={isDarkMode ? "#FFF" : "#000"} />
      </PressableScale>

      <FireTypeStyle
        visible={FirepopupVisible}
        transparent={true}
        onClose={FireclosePopup}
        onDismissed={runPendingAction}
        onSelect={selectFiretype}
        isDarkMode={isDarkMode}
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
}

export const FireTypeStyle = ({
  visible,
  transparent,
  onClose,
  onDismissed,
  onSelect,
  isDarkMode,
}: MapStylePopupProps) => {
  const { currentStep, moveToNextStep, isOnboardingComplete } = useOnboarding();
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
  }, [visible]);

  const handleActionPress = (action: string) => {
    // Prevent event bubbling and immediately select
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
        style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.modalContentWrapper,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, isDarkMode && styles.modalContentDark]}
          >
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Select Action</Text>
            <PressableScale
              onPress={() => handleActionPress("firelandmine")}
              style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
              haptic="select"
              pressedScale={0.96}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="radio-button-on" size={24} color={isDarkMode ? "#FFF" : "#000"} />
              </View>
              <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Place Landmine</Text>
            </PressableScale>
            <PressableScale
              onPress={() => handleActionPress("firemissile")}
              style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
              haptic="select"
              pressedScale={0.96}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="rocket" size={24} color={isDarkMode ? "#FFF" : "#000"} />
              </View>
              <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Fire Missile</Text>
            </PressableScale>
            <PressableScale
              onPress={() => handleActionPress("lootdrop")}
              style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
              haptic="select"
              pressedScale={0.96}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="gift" size={24} color={isDarkMode ? "#FFF" : "#000"} />
              </View>
              <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Request Loot Drop</Text>
            </PressableScale>
            <PressableScale
              onPress={() => handleActionPress("other")}
              style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
              haptic="select"
              pressedScale={0.96}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="sparkles-outline" size={24} color={isDarkMode ? "#FFF" : "#000"} />
              </View>
              <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Place Special Items</Text>
            </PressableScale>
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
    backgroundColor: '#FFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fireButtonDark: {
    backgroundColor: '#2C2C2C',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlayDark: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContentWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: "#1E1E1E",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  modalTitleDark: {
    color: "#FFF",
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 15,
    paddingLeft: 54,
    marginVertical: 10,
    width: '100%',
    position: 'relative',
  },
  actionButtonDark: {
    backgroundColor: "#2C2C2C",
  },
  iconContainer: {
    position: 'absolute',
    left: 15,
    width: 24,
  },
  actionText: {
    fontSize: 16,
    color: "#000",
    textAlign: 'center',
    flex: 1,
    marginRight: 24,
  },
  actionTextDark: {
    color: "#FFF",
  },
});
