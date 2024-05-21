import { Dimensions, Modal, Button, View } from "react-native";
import React from "react";
import { MissilefireposLibrary } from "./missile";

interface MissileFireProps {
    MissilefireposModalVisible: boolean;
    exitHandler: () => void;
}

interface MissileLibView {
    MissileModalVisible: boolean;
    MissileModalHandler: () => void;
    selectedPlayerUsername: string;
}

export const MissileLibraryView = (props: MissileLibView) => {

    //const [MissileModalVisible, setMissileModalVisible] = useState(false); 
    
 return (
    <Modal
    animationType="slide"
    transparent={true}
    visible={props.MissileModalVisible}
    onRequestClose={props.MissileModalHandler}
  >
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
        {/* Include MissileLibrary component */}
        <MissilefireposLibrary/>
        <View style={{ alignSelf: 'flex-end', padding: 10 }}>
          <Button title="Cancel" onPress={props.MissileModalHandler} />
        </View>
      </View>
    </View>
  </Modal>


 )
}

export const MissileFireConfirmationPopup = (props: MissileFireProps) => {
    return (
        <Modal
        animationType="slide"
        transparent={true}
        visible={props.MissilefireposModalVisible}
        onRequestClose={props.exitHandler}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
            {/* Include MissileLibrary component */}
            <MissilefireposLibrary/>
            <View style={{ alignSelf: 'flex-end', padding: 10 }}>
              <Button title="Cancel" onPress={props.exitHandler} />
            </View>
          </View>
        </View>
      </Modal>
    )
}