import { useCallback } from "react";
import { Missile } from "../types/types";

export const fetchMissilesFromBackend = async (): Promise<Missile[]> => {
    // Simulated fetch function to get missile data:
    return [
      {
        destination: { latitude: 45.2949318, longitude: -0.852764 }, 
        currentLocation: { latitude: 45.2949318, longitude: -0.852764 }, 
        radius: 100, 
        type: "TheNuke", 
        status: "Hit", 
        sentbyusername: ""
      }, //temp missile location
      {
        destination: { latitude: 51.025316, longitude: -3.115612 }, 
        currentLocation: { latitude: 52.025316, longitude: -3.115612 }, 
        radius: 50, 
        type: "Ballista", 
        status: "Approaching",
        sentbyusername: ""
      }, //2nd temp missle location TS
    ];
  };

export const fetchLootFromBackend = async () => {
    // Simulated fetch function to get loot data:
    return [
    { latitude: 51.026281, longitude: -3.113764, rarity: "" }, // Loot location 1 TS
    { latitude: 45.305, longitude: -0.86, rarity: "" }, // Loot location 2
    ];
};

export const fetchlandmineFromBackend = async () => {
    // Simulated fetch function to get landmine data:
    return [
    { latitude: 45.2949318, longitude: -0.852764, placedby: "Test2", Type: "", Expire: "" }, //temp landmine location
    { latitude: 51.025682, longitude: -3.1174578, placedby: "Test", Type: "", Expire: ""}, //2nd temp landmine location TS
    ];
};