import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unzip, WebSocketMessage, zip } from "middle-earth";
import * as SecureStore from "expo-secure-store";

const WEBSOCKET_URL = process.env.EXPO_PUBLIC_WEBSOCKET_URL || "ws://localhost:3000";
const RECONNECT_INTERVAL = 5000;

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
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connectWebsocket = useCallback(async () => {
        if (!token) {
            console.log('No token available. Skipping WebSocket connection.');
            return;
        }

        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected.');
            return;
        }

        const ws = new WebSocket(WEBSOCKET_URL, token);

        const connectionTimeout = setTimeout(() => {
            console.log("WebSocket connection attempt timed out");
            ws.close();
        }, 10000);

        ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log("Connected to websocket");
            setIsConnected(true);
            AsyncStorage.setItem('dbconnection', 'true');
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed");
            setIsConnected(false);
            AsyncStorage.setItem('dbconnection', 'false');
            reconnectWebsocket();
        };

        ws.onmessage = async (event) => {
            try {
                await AsyncStorage.setItem('dbconnection', 'true');
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

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        setWebsocket(ws);
    }, [token]);

    const reconnectWebsocket = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
            if (!isConnected) {
                console.log("Attempting to reconnect WebSocket...");
                connectWebsocket();
            }
        }, RECONNECT_INTERVAL);
    }, [isConnected, connectWebsocket]);

    useEffect(() => {
        const initializeWebSocket = async () => {
            const isSignedIn = await AsyncStorage.getItem('signedIn');
            if (isSignedIn === 'true') {
                const storedToken = await SecureStore.getItemAsync("token");
                setToken(storedToken);
            }
        };

        initializeWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (websocketRef.current) {
                websocketRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (token && !isConnected) {
            connectWebsocket();
        }
    }, [token, isConnected, connectWebsocket]);

    useEffect(() => {
        if (!isConnected) {
            reconnectWebsocket();
        }
    }, [isConnected, reconnectWebsocket]);

    const signOut = async () => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.close();
        }
        setIsConnected(false);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.setItem('dbconnection', 'false');
        console.log('Signed out and disconnected from WebSocket');
    };
    
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const initializeWebSocket = async () => {
            const isSignedIn = await AsyncStorage.getItem('signedIn');
            if (isSignedIn === 'true' && !isConnected) {
                await connectWebsocket();
            }
        };

        initializeWebSocket();

        intervalId = setInterval(async () => {
            const isSignedIn = await AsyncStorage.getItem('signedIn');
            if (isSignedIn === 'true' && !isConnected) {
                await connectWebsocket();
            } else if (isSignedIn !== 'true' && isConnected) {
                await signOut();
            }
        }, RECONNECT_INTERVAL);

        return () => {
            clearInterval(intervalId);
            if (websocket) {
                websocket.close();
            }
            AsyncStorage.setItem('dbconnection', 'false');
        };
    }, [isConnected]); // Dependency on isConnected to manage WebSocket based on sign-in status

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

    return { data, missiledata, landminedata, lootdata, healthdata, friendsdata, inventorydata, playerlocations, sendWebsocket, isConnected };
};

export default useWebSocket;