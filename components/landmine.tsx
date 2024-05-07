import { Landmine } from "../types/types";

export const fetchLandminesFromBackend = async (): Promise<Landmine[]> => {
  // Simulated data for demonstration
  return [
    { latitude: 45.2949318, longitude: -0.852764, placedby: "Test2", Expire: "" },
    { latitude: 51.025682, longitude: -3.1174578, placedby: "Test", Expire: ""},
  ];
};

// Function to add a landmine to the map
export const addLandmineToMap = (latitude: number, longitude: number, placedby: string): void => {
  // Add logic here to add the landmine to the map backend
  console.log(`Landmine added at: Latitude ${latitude}, Longitude ${longitude}, Placed by ${placedby}`);
};