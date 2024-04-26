import { Modal, View, Text, TouchableOpacity } from "react-native";

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
        className="flex-1 justify-center items-center bg-black bg-opacity-50"
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View className="bg-white rounded-lg p-5 items-center shadow-md">
          <TouchableOpacity
            onPress={() => onSelect("default")}
            className="rounded p-[10px] my-[5px] bg-gray-200 w-[200px] items-center"
          >
            <Text className="text-[16px]">Default</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelect("radar")}
            className="rounded p-[10px] my-[5px] bg-gray-200 w-[200px] items-center"
          >
            <Text className="text-[16px]">Radar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelect("cherry")}
            className="rounded p-[10px] my-[5px] bg-gray-200 w-[200px] items-center"
          >
            <Text className="text-[16px]">Cherry Blossom</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
