import { useState, useEffect } from "react";
import { encode, decode } from "msgpack-lite";
import { WebSocketMessage } from "middle-earth";
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEBSOCKET_URL = process.env.EXPO_PUBLIC_WEBSOCKET_URL || "ws://localhost:3000";
const RECONNECT_INTERVAL_BASE = 1000; // base interval in ms
const MAX_RECONNECT_ATTEMPTS = 10;
const WEBSOCKET_PROTOCOL = 'missilewars';

const useWebSocket = () => {
    const [data, setData] = useState<any>(null);
    const [websocket, setWebsocket] = useState<WebSocket | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    const connectWebsocket = (): Promise<WebSocket> => {
        return new Promise(async (resolve, reject) => {  // Make the outer function async
            const ws = new WebSocket(WEBSOCKET_URL);
    
            ws.onopen = async () => {  // Mark the callback function as async
                console.log("Connected to websocket");
                await AsyncStorage.setItem('dbconnection', 'true');
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
                    let receivedData;

                    // Attempt to decode MessagePack data
                    try {
                        receivedData = decode(new Uint8Array(event.data)); // Decode MessagePack data
                        console.log("Received data from websocket (MessagePack)", receivedData);
                    } catch (msgpackError) {
                        console.log("Error decoding MessagePack data:", msgpackError);
                        // Fallback to JSON parsing
                        try {
                            receivedData = JSON.parse(event.data); // Attempt JSON parsing
                            console.log("Received data from websocket (JSON fallback)", receivedData);
                        } catch (jsonError) {
                            console.error("Error parsing JSON data:", jsonError);
                            return; // Exit early if both decoding methods fail
                        }
                    }

                    setData(receivedData);
                    // Handle or process receivedData as needed
                } catch (error) {
                    console.error("Error processing websocket message:", error);
                }
            };
            
        } catch (error) {
            console.error("Failed to connect to websocket:", error);
            await AsyncStorage.setItem('dbconnection', 'false');
            reconnectWebsocket();
        }
    };

    const reconnectWebsocket = async () => {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error("Max reconnect attempts reached. Could not connect to WebSocket.");
            return;
        }

        setReconnectAttempts((prevAttempts) => prevAttempts + 1);
        const retryInterval = RECONNECT_INTERVAL_BASE * Math.pow(2, reconnectAttempts);

        console.log(`Retrying to connect to websocket in ${retryInterval / 1000} seconds...`);

        setTimeout(async () => {
            await initializeWebSocket();
        }, retryInterval);
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
