import { Circle } from "react-native-maps";
import { Location } from "../types/types";

interface MissleProps {
  location: Location;
  radius: number;
}

// Missile Component
export const Missile = ({ location, radius }: MissleProps) => (
  <Circle
    center={location}
    radius={radius}
    fillColor="rgba(255, 0, 0, 0.5)" // Red color
    strokeColor="rgba(255, 0, 0, 0.8)"
  />
);
