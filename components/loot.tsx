import { Circle } from "react-native-maps";
import { Location } from "../types/types";

// Loot Component
export const Loot = ({ location }: { location: Location }) => (
  <Circle
    center={location}
    radius={40} // 40 meters
    fillColor="rgba(0, 0, 255, 0.5)" // Blue color
    strokeColor="rgba(0, 0, 255, 0.8)"
  />
);
