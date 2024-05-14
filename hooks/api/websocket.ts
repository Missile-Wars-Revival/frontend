
import { useState } from "react";
import { Location } from "../../types/types";
let websocket!: WebSocket;

let data!: any;

interface OutgoingWebsocketData {
    uniqueId?: string;
    location: Location;
}

const connectWebsocket = () => new Promise<WebSocket>((resolve, reject) => {
    //const url = "ws://192.168.1.185:3000";
    const url = process.env.EXPO_PUBLIC_WEBSOCKET_URL || "ws://localhost:3000";
    const websocket = new WebSocket(url);

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


export const sendWebsocket = async (data: any) => {
    console.log("Sending data to websocket", data);

    // Ensure the WebSocket connection is open before sending data
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        await new Promise((resolve) => {
            websocket.onopen = resolve;
        });
    }

    websocket.send(JSON.stringify(data));
}

export default function useWebSocket() {
    let [data, setData] = useState<any>(null);
    // Create a WebSocket connection
    getWebsocket();

    return data;
}

const updateLocation = (location: Location) => {
    const outgoingData: OutgoingWebsocketData = {
        uniqueId: "player1",
        location: location
    };
    sendWebsocket(outgoingData);
};
