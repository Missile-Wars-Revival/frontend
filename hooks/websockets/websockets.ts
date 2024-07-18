import { useState, useEffect } from "react";
import { decode, encode } from "msgpack-lite";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebSocketMessage } from "middle-earth";

const WEBSOCKET_URL = process.env.EXPO_PUBLIC_WEBSOCKET_URL || "ws://localhost:3000";
const RECONNECT_INTERVAL_BASE = 1000; // base interval in ms
const MAX_RECONNECT_ATTEMPTS = 10;
const WEBSOCKET_PROTOCOL = 'missilewars';

const useWebSocket = () => {
    const [data, setData] = useState<any>(null);
    const [websocket, setWebsocket] = useState<WebSocket | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    const connectWebsocket = (): Promise<WebSocket> => {
        return new Promise(async (resolve, reject) => {
            const ws = new WebSocket(WEBSOCKET_URL, WEBSOCKET_PROTOCOL);

            ws.onopen = () => {
                console.log("Connected to websocket");
                AsyncStorage.setItem('dbconnection', 'true');
                resolve(ws);
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                reject(error);
            };
        });
    };

    const initializeWebSocket = async () => {
        try {
            const ws = await connectWebsocket();
            setWebsocket(ws);
            setReconnectAttempts(0); // Reset reconnect attempts on successful connection

            ws.onclose = () => {
                console.log('WebSocket connection closed');
                reconnectWebsocket();
            };

            ws.onmessage = (event) => {
                try {
                    const receivedData = decode(new Uint8Array(event.data));
                    //console.log("Received data from websocket:", receivedData);
                    if (Array.isArray(receivedData)) {
                        // Handle array of messages
                        receivedData.forEach((receivedData) => {
                            if (receivedData.itemType === "Missile") {
                                const missiles = receivedData; 
                                console.log("Received missiles:", missiles);
                                setData(missiles); // Assuming 'payload' contains the missile data
                            }
                            if (receivedData.itemType === "Landmine") {
                                const Landmine = receivedData; 
                                console.log("Received Landmine:", Landmine);
                                setData(Landmine); // Assuming 'payload' contains the missile data
                            }
                            if (receivedData.itemType === "Loot") {
                                const Loot = receivedData; 
                                console.log("Received Loot:", Loot);
                                setData(Loot); // Assuming 'payload' contains the missile data
                            }
                        });
                    } else {
                        // Handle single message
                    }

                    // Further processing based on different types of messages
                } catch (error) {
                    console.error("Error processing msgpack message, attempting JSON:", error);
                    try {
                        const receivedData = JSON.parse(event.data);
                        console.log("Received JSON data from websocket:", receivedData);
                        
                    } catch (jsonError) {
                        console.error("Error processing JSON message:", jsonError);
                    }
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
                const encodedData = encode(data);
                console.log("Sending data to websocket", data);
                websocket.send(encodedData);
            } catch (error) {
                console.error("Error encoding data for websocket:", error);
            }
        } else {
            console.error("WebSocket is not open. Unable to send message.");
        }
    };

    return { data, sendWebsocket };
};

export default useWebSocket;
