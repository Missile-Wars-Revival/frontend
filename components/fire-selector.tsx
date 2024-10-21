import React, { useState } from "react";
import { FireType } from "../components/fire-type-popup";
import { MissileFireConfirmationPopup, MissileLibraryView } from "./Missile/missile-confirmation-popup";
import { View } from "react-native";
import { MapStyleElement } from "react-native-maps";
import { LandmineLibraryView } from "./Landmine/landmine";
import { LootLibraryView } from "./Loot/loot";
import { OtherLibraryView } from "./Other/other";

interface FireSelectorProps {
    selectedMapStyle: MapStyleElement[];
    getStoredMapStyle: () => Promise<string | null>;
    selectMapStyle: (style: string) => void;
}

export const FireSelector = (props: FireSelectorProps) => {
    const [MissileModalVisible, setMissileModalVisible] = useState(false);
    const [MissilefireposModalVisible, setMissilefireposModalVisible] = useState(false);
    const [LandmineModalVisible, setLandmineModalVisible] = useState(false);
    const [LootModelVisable, setLootModelVisable] = useState(false);
    const [OtherModelVisable, setOtherModelVisable] = useState(false);

    return (
        <View>
            {/* Missile library popup */}
            <MissileLibraryView MissileModalVisible={MissileModalVisible} MissileModalHandler={() => setMissileModalVisible(false)} selectedPlayerUsername={""} />
            {/* Missile Fire at position library popup */}
            <MissileFireConfirmationPopup MissilefireposModalVisible={MissilefireposModalVisible} exitHandler={() => setMissilefireposModalVisible(false)} />

            {/* Landmine library popup */}
            <LandmineLibraryView LandmineModalVisible={LandmineModalVisible} landminePlaceHandler={() => setLandmineModalVisible(false)} />

            <LootLibraryView LootModalVisible={LootModelVisable} LootPlaceHandler={() => setLootModelVisable(false)} />

            <OtherLibraryView OtherModalVisible={OtherModelVisable} OtherPlaceHandler={() => setOtherModelVisable(false)} />

            {/* Fire Select button */}
            <FireType landmineFireHandler={() => setLandmineModalVisible(true)} missileFireHandler={() => setMissileModalVisible(true)} lootrequesthandler={() => setLootModelVisable(true)} otherrequesthandler={() => setOtherModelVisable(true)}/>

        </View>
    )
}