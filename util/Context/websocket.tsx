import { ReactNode, createContext, useContext } from "react";
import { WebSocketMessage } from "middle-earth";

export interface WebSocketContextProps {
    data: any;
    missiledata: any;
    landminedata: any;
    lootdata:any;
    otherdata:any;
    healthdata: any;
    friendsdata: any;
    inventorydata: any;
    playerlocations: any;
    sendWebsocket: (data: WebSocketMessage) => void;
  }

export const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
};

export interface WebSocketProviderProps {
  children: ReactNode;
}