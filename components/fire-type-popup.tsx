import { Modal, View, Text, TouchableOpacity } from "react-native";

interface MapStylePopupProps {
  visible: boolean;
  transparent: boolean;
  onClose: () => void;
  onSelect: (style: string) => void;
}

export const FireTypeStyle = ({
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
      <TouchableOpacity
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black background
        }}
        activeOpacity={1}
        onPressOut={onClose}
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
          <TouchableOpacity
            onPress={() => onSelect("firelandmine")}
            style={{
              borderRadius: 10,
              padding: 10,
              marginBottom: 5,
              backgroundColor: "#ccc",
              width: 200,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>Place Landmine</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelect("firemissile")}
            style={{
              borderRadius: 10,
              padding: 10,
              marginBottom: 5,
              backgroundColor: "#ccc",
              width: 200,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>Fire Missile</Text>
          </TouchableOpacity>

{/* Room to expand: */}

          {/* <TouchableOpacity
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
          </TouchableOpacity> */}
          {/* <TouchableOpacity
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
          </TouchableOpacity> */}
          {/* <TouchableOpacity
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
          </TouchableOpacity> */}

        </View>
      </TouchableOpacity>
    </Modal>
  );
};
