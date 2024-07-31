import { ImageSourcePropType } from "react-native";

//for missile library
export interface Missilelib {
  type: string;
  quantity: number;
}
//for landmine lib
export interface LandmineLib {
  type: string;
  quantity: number;
  description: string;
}

export interface Friend {
  username: string;
}

export type MapStyle = {
  elementType?: string; //element is optional
  stylers: Array<{ color?: string; visibility?: string }>;
};

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  image?: ImageSourcePropType;
}
