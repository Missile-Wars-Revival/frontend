import { Modal, View, Text, Pressable } from "react-native";
import React from "react";

interface MapStylePopupProps {
  visible: boolean;
  transparent: boolean;
  onClose: () => void;
  onSelect: (style: string) => void;
}

export const MapStylePopup = ({
  visible,
  transparent,
  onClose,
  onSelect,
}: MapStylePopupProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={transparent}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black background
        }}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 10,
            padding: 20,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Pressable
            onPress={() => onSelect("default")}
            style={{
              borderRadius: 10,
              padding: 10,
              marginBottom: 5,
              backgroundColor: "#ccc",
              width: 200,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>Default</Text>
          </Pressable>
          <Pressable
            onPress={() => onSelect("radar")}
            style={{
              borderRadius: 10,
              padding: 10,
              marginBottom: 5,
              backgroundColor: "#ccc",
              width: 200,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>Radar</Text>
          </Pressable>
          <Pressable
            onPress={() => onSelect("cherry")}
            style={{
              borderRadius: 10,
              padding: 10,
              marginBottom: 5,
              backgroundColor: "#ccc",
              width: 200,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>Cherry Blossom</Text>
          </Pressable>
          <Pressable
            onPress={() => onSelect("cyber")}
            style={{
              borderRadius: 10,
              padding: 10,
              marginBottom: 5,
              backgroundColor: "#ccc",
              width: 200,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>CyberPunk</Text>
          </Pressable>
          <Pressable
            onPress={() => onSelect("colourblind")}
            style={{
              borderRadius: 10,
              padding: 10,
              marginBottom: 5,
              backgroundColor: "#ccc",
              width: 200,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>Colour Blind</Text>
          </Pressable>

        </View>
      </Pressable>
    </Modal>
  );
};
