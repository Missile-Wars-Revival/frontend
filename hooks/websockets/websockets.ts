import { useState, useEffect, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unzip, WebSocketMessage, WSMsg, zip } from "middle-earth";
import { getDatabase, ref, onValue, get } from "firebase/database";
import { useAuth } from "../../util/Context/authcontext";
import { auth } from "../../util/firebase/firebaseAuth";
import {
    getWsUrl,
    isServerSessionConfirmed,
    recordServerFailure,
    resetServerFailures,
    subscribeServerSession,
} from "../../api/server-discovery";
import { getSecureItemSafely } from "../../util/secure-store";

const RECONNECT_INTERVAL_BASE = 1000; // base interval in ms
const MAX_RECONNECT_ATTEMPTS = 10;
const DEV_OFFLINE_TOKEN = "dev-offline-token";

const isDevOfflineToken = (token: string | null): token is string => token === DEV_OFFLINE_TOKEN;

const formatWebSocketError = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "_type" in error) {
        return `event:${String((error as { _type?: string })._type ?? "unknown")}`;
    }
    return "unknown websocket error";
};

const useWebSocket = () => {
    const { isSignedIn } = useAuth();
    // Phase 7: in distributed mode the connection waits until the player has
    // confirmed a server for this session (post-login selector). Solo/legacy
    // setups without a coordinator are always confirmed.
    const [serverConfirmed, setServerConfirmed] = useState(isServerSessionConfirmed());
    const [missiledata, setmissileData] = useState<any>(null);
    const [landminedata, setlandmineData] = useState<any>(null);
    const [lootdata, setlootData] = useState<any>(null);
    const [otherdata, setotherData] = useState<any>(null);
    const [healthdata, sethealthData] = useState<any>(null);
    const [friendsdata, setfriendsData] = useState<any>(null);
    const [inventorydata, setinventoryData] = useState<any>(null);
    const [playerlocations, setplayerlocations] = useState<any>(null);
    const [leaguesData, setLeaguesData] = useState<any>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Set when a reconnect was deferred because the app was backgrounded; the
    // AppState listener performs it as soon as the app is active again.
    const reconnectOnForegroundRef = useRef(false);

    const clearReconnectTimer = () => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    };

    // Phase 6 social cutover: friendships live in Firebase central
    // (/friends/<uid> uid edges, written by api/friends.ts). The game server
    // only gets a DECLARED username list over the websocket, used for
    // gameplay (visibility, friendly-fire exemption, proximity). This
    // listener re-declares on every change, so adds/removes — from any of the
    // user's devices — reach the server within moments.
    const friendsDeclareUnsubRef = useRef<(() => void) | null>(null);

    const stopFriendsDeclare = () => {
        friendsDeclareUnsubRef.current?.();
        friendsDeclareUnsubRef.current = null;
    };

    const startFriendsDeclare = () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return; // legacy/offline session — nothing to declare
        stopFriendsDeclare();
        const db = getDatabase();
        friendsDeclareUnsubRef.current = onValue(ref(db, `friends/${uid}`), async (snap) => {
            try {
                const friendUids = snap.exists() ? Object.keys(snap.val() as Record<string, unknown>) : [];
                const usernames = (
                    await Promise.all(
                        friendUids.map(async (fuid) => {
                            const nameSnap = await get(ref(db, `profiles/${fuid}/username`));
                            return nameSnap.exists() ? String(nameSnap.val()) : null;
                        })
                    )
                ).filter((name): name is string => !!name);

                const ws = websocketRef.current;
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(zip(new WebSocketMessage([new WSMsg("friendsDeclare", { friends: usernames })])));
                }
            } catch (error) {
                console.error("Failed to declare friends to game server:", error);
            }
        });
    };

    // Intentional close (sign-out, offline mode): detach onclose first so it
    // doesn't schedule a reconnect.
    const closeWebsocket = () => {
        stopFriendsDeclare();
        if (websocketRef.current) {
            websocketRef.current.onclose = null;
            websocketRef.current.close();
            websocketRef.current = null;
        }
    };

    const connectWebsocket = (token: string): Promise<WebSocket> => {
        return new Promise(async (resolve, reject) => {
            try {
                if (!token) {
                    console.log('Token not found');
                    reject(new Error('Token not found'));
                    return;
                }
                // Use the token as a query parameter instead of as a protocol.
                // The URL is resolved at connect time so a server-picker
                // change applies on the next (re)connect.
                const ws = new WebSocket(`${getWsUrl()}?token=${encodeURIComponent(token)}`);
    
                ws.onopen = () => {
                    console.log("Connected to websocket");
                    AsyncStorage.setItem('dbconnection', 'true');
                    resolve(ws);
                };
    
                ws.onerror = (error) => {
                    console.error("WebSocket error:", formatWebSocketError(error));
                    reject(error);
                };
    
                ws.onclose = (event) => {
                    console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
                    AsyncStorage.setItem('dbconnection', 'false');
                };
            } catch (error) {
                console.error("Error setting up WebSocket:", error);
                reject(error);
            }
        });
    };

    const initializeWebSocket = async () => {
        clearReconnectTimer();
        try {
            const token = await getSecureItemSafely("token");

            // Dev-only offline sessions should not attempt websocket/network reconnect loops.
            if (isDevOfflineToken(token)) {
                closeWebsocket();
                await AsyncStorage.setItem('dbconnection', 'true');
                reconnectAttemptsRef.current = 0;
                return;
            }

            if (!token) {
                await AsyncStorage.setItem('dbconnection', 'false');
                return;
            }

            const ws = await connectWebsocket(token);
            websocketRef.current = ws;
            reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
            // Phase 12: a good connection clears the stored-shard failure streak.
            resetServerFailures().catch(() => {});
            // Declare the Firebase-central friends list to this server (fires
            // immediately on attach, then again on every friends change).
            startFriendsDeclare();

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
                            case "other":
                                //console.log("Received Loot:", msg.data);
                                setotherData(msg.data);
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
                            case "leagues":
                                //console.log("Received league data:", msg.data);
                                setLeaguesData(msg.data);
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
            console.error("Failed to connect to websocket:", formatWebSocketError(error));
            AsyncStorage.setItem('dbconnection', 'false');
            reconnectWebsocket();
        }
    };

    const reconnectWebsocket = async () => {
        // While backgrounded the OS suspends networking, so retries would just
        // burn through the backoff budget. Defer instead; the AppState listener
        // reconnects immediately (with a fresh budget) on foreground.
        if (AppState.currentState !== 'active') {
            reconnectOnForegroundRef.current = true;
            return;
        }

        const token = await getSecureItemSafely("token");
        if (isDevOfflineToken(token)) {
            await AsyncStorage.setItem('dbconnection', 'true');
            return;
        }

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.error("Max reconnect attempts reached. Could not connect to WebSocket.");
            // Phase 12: count this as a failure for the stored shard. After
            // enough consecutive give-ups the shard is dropped and the session
            // un-confirmed, so ServerSessionGate routes the player back to the
            // selector instead of looping on a dead/migrating server.
            recordServerFailure().catch(() => {});
            return;
        }

        const retryInterval = RECONNECT_INTERVAL_BASE * Math.pow(2, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current += 1;

        console.log(`Retrying to connect to websocket in ${retryInterval / 1000} seconds...`);

        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(initializeWebSocket, retryInterval);
    };

    useEffect(() => {
        return subscribeServerSession(() => setServerConfirmed(isServerSessionConfirmed()));
    }, []);

    useEffect(() => {
        if (isSignedIn && serverConfirmed) {
            initializeWebSocket();
        } else {
            clearReconnectTimer();
            closeWebsocket();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSignedIn, serverConfirmed]);

    // Reconnect promptly when the app returns to the foreground — the OS
    // usually drops the socket in the background and backoff timers may be
    // far in the future (or exhausted) by the time the user comes back.
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state !== 'active' || !isSignedIn || !serverConfirmed) return;

            const ws = websocketRef.current;
            const socketDown =
                !ws ||
                ws.readyState === WebSocket.CLOSING ||
                ws.readyState === WebSocket.CLOSED;

            if (reconnectOnForegroundRef.current || socketDown) {
                reconnectOnForegroundRef.current = false;
                reconnectAttemptsRef.current = 0;
                clearReconnectTimer();
                initializeWebSocket();
            }
        });
        return () => subscription.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSignedIn, serverConfirmed]);

    const sendWebsocket = async (data: WebSocketMessage) => {
        const isSignedIn = await AsyncStorage.getItem('signedIn');
        
        if (isSignedIn !== 'true') {
            console.log("User is not signed in. Skipping websocket message.");
            return;
        }

        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            try {
                const encodedData = zip(data);
                // console.log("Sending data to websocket", data);
                websocketRef.current.send(encodedData);
            } catch (error) {
                console.error("Error sending websocket request:", error);
            }
        } else {
            console.log("WebSocket is not open. Unable to send message.");
        }
    };

    return { missiledata, landminedata, lootdata, otherdata, healthdata, friendsdata, inventorydata, playerlocations, leaguesData, sendWebsocket };
};

export default useWebSocket;
