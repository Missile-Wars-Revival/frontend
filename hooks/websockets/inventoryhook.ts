import { InventoryItem } from "../../types/types";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchInventory = (): InventoryItem[] => {
    const { inventorydata } = useWebSocketContext();
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

    useEffect(() => {
        if (!inventorydata) {
            // WebSocket not connected yet or no data received
            return;
        }

        if (typeof inventorydata !== 'object' || inventorydata === null) {
            console.warn('Unexpected inventory data format:', typeof inventorydata);
            return;
        }

        let dataToProcess: any[] = [];

        if (Array.isArray(inventorydata)) {
            dataToProcess = inventorydata;
        } else {
            // If it's an object, convert it to an array
            dataToProcess = Object.values(inventorydata);
        }

        const processedItems = dataToProcess.map((item, index) => ({
            category: item.category || '',
            name: item.name || '',
            quantity: item.quantity || 0,
            id: item.id || `id-${item.name}-${index}`,
        }));

        setInventoryItems(processedItems);
    }, [inventorydata]);

    return inventoryItems;
};

export default useFetchInventory;