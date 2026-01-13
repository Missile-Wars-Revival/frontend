import React, { useState, useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, useColorScheme, Dimensions, Animated } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../util/Context/onboardingContext';

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

  const selectFiretype = (style: string) => {
    // Trigger the handler first to open the next modal
    switch (style) {
      case "firelandmine":
        props.landmineFireHandler();
        if (currentStep === 'fire_landmine') {
          moveToNextStep();
        }
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

    // Don't close the fire selector - let it stay in the background
    // This prevents modal conflicts
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.fireButton, isDarkMode && styles.fireButtonDark]}
        onPress={FireshowPopup}
      >
        <Ionicons name="flame" size={24} color={isDarkMode ? "#FFF" : "#000"} />
      </TouchableOpacity>

      <FireTypeStyle
        visible={FirepopupVisible}
        transparent={true}
        onClose={FireclosePopup}
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
  onSelect: (style: string) => void;
  isDarkMode: boolean;
}

export const FireTypeStyle = ({
  visible,
  transparent,
  onClose,
  onSelect,
  isDarkMode,
}: MapStylePopupProps) => {
  const { currentStep, moveToNextStep, isOnboardingComplete } = useOnboarding();
  const slideAnim = useRef(new Animated.Value(300)).current;

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
    >
      <TouchableOpacity
        style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}
        activeOpacity={1}
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
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, isDarkMode && styles.modalContentDark]}
          >
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Select Action</Text>
            <TouchableOpacity
              onPress={() => handleActionPress("firelandmine")}
              style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="radio-button-on" size={24} color={isDarkMode ? "#FFF" : "#000"} />
              </View>
              <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Place Landmine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleActionPress("firemissile")}
              style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="rocket" size={24} color={isDarkMode ? "#FFF" : "#000"} />
              </View>
              <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Fire Missile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleActionPress("lootdrop")}
              style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="gift" size={24} color={isDarkMode ? "#FFF" : "#000"} />
              </View>
              <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Request Loot Drop</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleActionPress("other")}
              style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="sparkles-outline" size={24} color={isDarkMode ? "#FFF" : "#000"} />
              </View>
              <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Place Special Items</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fireButton: {
    position: 'absolute',
    bottom: 30,
    left: width * 0.04,
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
