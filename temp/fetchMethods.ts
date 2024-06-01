import { Missile } from "../types/types";

// export const fetchMissilesFromBackend = async (): Promise<Missile[]> => {
//     // Simulated fetch function to get missile data:
//     return [
//       {
//         destination: { latitude: 45.2949318, longitude: -0.852764 }, 
//         currentLocation: { latitude: 45.2949318, longitude: -0.852764 }, 
//         radius: 100, 
//         type: "TheNuke", 
//         status: "Hit", 
//         sentbyusername: ""
//       }, //temp missile location
//       {
//         destination: { latitude: 51.025316, longitude: -3.115612 }, 
//         currentLocation: { latitude: 52.025316, longitude: -3.115612 }, 
//         radius: 50, 
//         type: "Ballista", 
//         status: "Approaching",
//         sentbyusername: ""
//       }, //2nd temp missle location TS
//     ];
//   };

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

import WebSocket from 'isomorphic-ws';
export const fetchMissilesFromBackend = async (): Promise<Missile[]> => {
  return new Promise((resolve, reject) => {
    // Set the authorization token in the URL
    const authToken = 'missilewars';
    
    //doesnt work on localhost for some reason 
    const ws = new WebSocket(`ws://192.168.3.17:3000/missile-data?authorization=missilewars`);

    ws.onopen = () => {
      console.log('WebSocket connected. Sending request for missile data...');
      // Send a request to the server to fetch missile data
      ws.send(JSON.stringify({ action: 'getMissiles' }));
    };

    ws.onmessage = (event: { data: string; }) => {
      try {
        // Handle incoming messages from the server
        const data = JSON.parse(event.data);
        if (data.action === 'missileData') {
          // Resolve the promise with the missile data received from the server
          resolve(data.missiles);
          // Close the websocket connection
          ws.close();
        }
      } catch (error) {
        // If there's an error parsing the incoming message
        reject(new Error('Error parsing incoming message.'));
      }
    };

    ws.onerror = (error: Event) => {
      // Reject the promise if there's an error with the websocket connection
      console.error('WebSocket connection error:', error);
      reject(new Error('WebSocket connection error.'));
    };

    // ws.onclose = (event: CloseEvent) => {
    //   // Check if the connection was closed unexpectedly
    //   if (!event.wasClean) {
    //     console.error('WebSocket connection closed unexpectedly.');
    //     reject(new Error('WebSocket connection closed unexpectedly.'));
    //   }
    // };
  });
};
