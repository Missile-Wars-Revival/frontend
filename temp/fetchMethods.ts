import { Landmine, Loot, Missile } from "middle-earth";
import { useCallback } from "react";


export const fetchMissilesFromBackend = async (): Promise<Missile[]> => {
    // Simulated fetch function to get missile data:
    return [
      {
        destination: { latitude: 45.2949318, longitude: -0.852764 },
        currentLocation: { latitude: 45.2949318, longitude: -0.852764 },
        radius: 100,
        type: "TheNuke",
        status: "Hit",
        sentbyusername: "",
        missileId: 2,
        timesent: "",
        etatimetoimpact: ""
      }, //temp missile location
      {
        destination: { latitude: 51.025316, longitude: -3.115612 },
        currentLocation: { latitude: 52.025316, longitude: -3.115612 },
        radius: 50,
        type: "Ballista",
        status: "Approaching",
        sentbyusername: "",
        missileId: 1,
        timesent: "",
        etatimetoimpact: ""
      }, //2nd temp missle location TS
    ];
  };

export const fetchLootFromBackend = async (): Promise<Loot[]> => {
    // Simulated fetch function to get loot data:
    return [
    { location: { latitude: 51.026281, longitude: -3.113764}, rarity: "" }, // Loot location 1 TS
    { location: {latitude: 45.305, longitude: -0.86}, rarity: "" }, // Loot location 2
    ];
};

export const fetchlandmineFromBackend = async (): Promise<Landmine[]> => {
    // Simulated fetch function to get landmine data:
    return [
    {
      location: {latitude: 45.2949318, longitude: -0.852764}, placedby: "Test2", type: "", etaexpiretime: "",
      placedtime: ""
    }, //temp landmine location
    {
      location: { latitude: 51.025682, longitude: -3.1174578}, placedby: "Test", type: "", etaexpiretime: "",
      placedtime: ""
    }, //2nd temp landmine location TS
    ];
};