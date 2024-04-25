import { Circle } from "react-native-maps";
import { Location } from "../types/types";

// landmine Component
export const Landmine = ({ location }: { location: Location }) => (
  <Circle
    center={location}
    radius={20} //radius 20
    fillColor="rgba(128, 128, 128, 0.5)" //gray colour
    strokeColor="rgba(128, 128, 128, 0.8)"
  />
);
