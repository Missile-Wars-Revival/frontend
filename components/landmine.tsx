import { Landmine } from "../types/types";

export type LandminePlacementPopupProps = {
  visible: boolean;
  onClose: () => void;
};

export const fetchLandminesFromBackend = async (): Promise<Landmine[]> => {
  // Simulated data for demonstration
  return [
    { latitude: 45.2949318, longitude: -0.852764, placedby: "Test2", Expire: "" },
    { latitude: 51.025682, longitude: -3.1174578, placedby: "Test", Expire: ""},
  ];
};

// Function to add a landmine to the map
export function addLandmine(latitude: number, longitude: number) {
  throw new Error("Function not implemented.");
}

