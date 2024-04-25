import { Modal, View, Text, TouchableOpacity } from "react-native";
import { styles } from "../styles";

interface MapStylePopupProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (style: string) => void;
}

export const MapStylePopup = ({
  visible,
  onClose,
  onSelect,
}: MapStylePopupProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.centeredView}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={styles.modalView}>
          <TouchableOpacity
            onPress={() => onSelect("default")}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Default</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelect("radar")}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Radar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelect("cherry")}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Cherry Blossom</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
