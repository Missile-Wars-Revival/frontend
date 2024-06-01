
import { useState } from "react";
<<<<<<< HEAD
import { Location } from "../../types/types";
import Constants from "expo-constants";
=======
>>>>>>> cd883d3b802d391f490c99378854678e1d997d55
let websocket!: WebSocket;
import * as Location from "expo-location";
import { Types } from "middle-earth";
import { encode } from "msgpack-lite";

let data!: any;

const connectWebsocket = () => new Promise<WebSocket>((resolve, reject) => {
<<<<<<< HEAD
    const uri = Constants?.expoConfig?.hostUri
        ? `ws://` + Constants.expoConfig.hostUri.split(`:`).shift()?.concat(`:3000`)
        : `missilewars.com`;

    const websocket = new WebSocket(uri, 'missilewars');
=======
    //const url = "ws://192.168.1.185:3000";

    const uri = process.env.EXPO_PUBLIC_WEBSOCKET_URL || "ws://localhost:3000";

    websocket = new WebSocket(uri, 'missilewars');
>>>>>>> cd883d3b802d391f490c99378854678e1d997d55

    websocket.onopen = () => {
        console.log("Connected to websocket");
        resolve(websocket);
    };

    websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
    };
});

const getWebsocket = () => {

    connectWebsocket().then((ws) => {
        websocket = ws;

        if (!websocket || websocket.readyState === WebSocket.CLOSED) {
            connectWebsocket();
            console.log("Connecting to websocket");
        }

        websocket.onclose = async () => {
            console.log('WebSocket connection closed');
            let connected = false;
            for (let i = 0; i < 100 && !connected; i++) {

                try {
                    websocket = await connectWebsocket()
                    connected = true;
                } catch {
                    setTimeout(() => {
                        console.log("Retrying to connect to websocket");
                    }, 20);
                }
            }
        };

        websocket.onmessage = (event) => {
            data = JSON.parse(event.data);
            console.log("Received data from websocket", data);
            websocket.send(JSON.stringify({ type: 'authenticate', token: 'missilewars' }));
        };
    }).catch((error) => {
        console.error("Failed to connect to websocket:", error);
    });
}


export const sendWebsocket = async (data: Types.WebSocketMsg) => {
    console.log("Sending data to websocket", data);

    websocket.send(encode(data));
}

export default function useWebSocket() {
    let [data, setData] = useState<any>(null);
    // Create a WebSocket connection
    getWebsocket();

    return data;
}

export const updateLocation = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
    console.log("Updating location");
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          reject("Permission to access location was denied");
        }

        Location.getCurrentPositionAsync({}).then((location_res) => {
          const loc = {
              lat: location_res.coords.latitude,
              lon: location_res.coords.longitude
          }
          console.log("Location updated", loc);
          const msg: Types.WebSocketMsg = {
              messages: [loc]
          }
          sendWebsocket(msg).then(() => resolve()).catch((error) => reject(error));
        }).catch((error) => {
          console.error(error);
          reject(error);
        });
    });
  };
