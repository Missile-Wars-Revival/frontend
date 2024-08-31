import { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unzip, WebSocketMessage, zip } from "middle-earth";
import * as SecureStore from "expo-secure-store";

const WEBSOCKET_URL = process.env.EXPO_PUBLIC_WEBSOCKET_URL || "ws://localhost:3000";
const RECONNECT_INTERVAL_BASE = 1000; // base interval in ms
const MAX_RECONNECT_ATTEMPTS = 10;
const WEBSOCKET_PROTOCOL = 'missilewars';

const useWebSocket = () => {
    const [data, setData] = useState<any>(null);
    const [missiledata, setmissileData] = useState<any>(null);
    const [landminedata, setlandmineData] = useState<any>(null);
    const [lootdata, setlootData] = useState<any>(null);
    const [healthdata, sethealthData] = useState<any>(null);
    const [friendsdata, setfriendsData] = useState<any>(null);
    const [inventorydata, setinventoryData] = useState<any>(null);
    const [playerlocations, setplayerlocations] = useState<any>(null);
    const [websocket, setWebsocket] = useState<WebSocket | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    const connectWebsocket = (): Promise<WebSocket> => {
        return new Promise(async (resolve, reject) => {
            const token = await SecureStore.getItemAsync("token");
            try {
                if (!token) {
                    console.log('Token not found');
                    return;
                }
                const ws = new WebSocket(WEBSOCKET_URL, token);

                ws.onopen = () => {
                    console.log("Connected to websocket");
                    AsyncStorage.setItem('dbconnection', 'true');
                    resolve(ws);
                };

                ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    reject(error);
                };
            } catch (error) {
            }
        });
    };

    const initializeWebSocket = async () => {
        try {
            const ws = await connectWebsocket();
            setWebsocket(ws);
            setReconnectAttempts(0); // Reset reconnect attempts on successful connection

            ws.onclose = () => {
                console.log('WebSocket connection closed');
                AsyncStorage.setItem('dbconnection', 'false');
                reconnectWebsocket();
            };

            ws.onmessage = async (event) => {
                try {
                    let uint8Array;

                    if (event.data instanceof Blob) {
                        // Convert Blob to ArrayBuffer then to Uint8Array
                        const arrayBuffer = await event.data.arrayBuffer();
                        uint8Array = new Uint8Array(arrayBuffer);
                    } else if (event.data instanceof ArrayBuffer) {
                        // Directly convert ArrayBuffer to Uint8Array
                        uint8Array = new Uint8Array(event.data);
                    } else if (typeof event.data === 'string') {
                        // Handle as a string directly, likely JSON
                        const receivedData = JSON.parse(event.data);
                        console.log("Received JSON data from websocket:", receivedData);
                        // Assuming data needs to be processed similarly to below

                        //processReceivedData(receivedData);
                        return; // Exit the function after handling
                    } else {
                        console.warn("Unhandled data type:", typeof event.data);
                        return; // Exit if data type is not handled
                    }

                    // Use the adapted unzip function if data was ArrayBuffer or Blob
                    const receivedData = unzip(uint8Array);

                    // Iterate over the messages array contained within the WebSocketMessage
                    receivedData.messages.forEach((msg) => {
                        switch (msg.itemType) {
                            case "missiles":
                                //console.log("Received Missiles:", msg.data);
                                setmissileData(msg.data);
                                break;
                            case "landmines":
                                //console.log("Received Landmine:", msg.data);
                                setlandmineData(msg.data);
                                break;
                            case "loot":
                                //console.log("Received Loot:", msg.data);
                                setlootData(msg.data);
                                break;
                            case "health":
                                //console.log("Received health:", msg.data);
                                sethealthData(msg.data);
                                break;
                            case "inventory":
                                //console.log("Received inventory:", msg.data);
                                setinventoryData(msg.data);
                                break;
                            case "friends":
                                //console.log("Received friends:", msg.data);
                                setfriendsData(msg.data);
                                break;
                            case "playerlocations":
                                //console.log("Received playerlocations:", msg.data);
                                setplayerlocations(msg.data);
                                break;
                            default:
                                console.warn("Unhandled itemType:", msg.itemType);
                        }
                    });
                } catch (error) {
                    console.error("Error processing websocket message:", error);
                    // Handle error more globally if needed
                }
            };

        } catch (error) {
            console.error("Failed to connect to websocket:", error);
            AsyncStorage.setItem('dbconnection', 'false');
            reconnectWebsocket();
        }
    };

    const reconnectWebsocket = async () => {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error("Max reconnect attempts reached. Could not connect to WebSocket.");
            return;
        }

        setReconnectAttempts(prevAttempts => prevAttempts + 1);
        const retryInterval = RECONNECT_INTERVAL_BASE * Math.pow(2, reconnectAttempts);

        console.log(`Retrying to connect to websocket in ${retryInterval / 1000} seconds...`);

        setTimeout(initializeWebSocket, retryInterval);
    };

    useEffect(() => {
        initializeWebSocket();

        return () => {
            websocket?.close();
        };
    }, []);

    const sendWebsocket = async (data: WebSocketMessage) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            try {
                const encodedData = zip(data);
                console.log("Sending data to websocket", data);
                websocket.send(encodedData);
            } catch (error) {
                console.error("Error sending websocket request",);
            }
        } else {
            console.error("WebSocket is not open. Unable to send message.");
        }
    };

    return { data, missiledata, landminedata, lootdata, healthdata, friendsdata, inventorydata, playerlocations, sendWebsocket };
};

export default useWebSocket;