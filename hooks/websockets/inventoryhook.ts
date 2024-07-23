import { InventoryItem } from "../../types/types";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchInventory = (): InventoryItem[] => {
    const { inventorydata } = useWebSocketContext();
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

    useEffect(() => {
        //console.log('Received data:', inventorydata);
        // First check if data is indeed an array
        if (Array.isArray(inventorydata)) {
            // Process the array data
            setInventoryItems(inventorydata.map(item => ({
                category: item.category,
                name: item.name,
                quantity: item.quantity,
                id: item.id || `id-${item.name}`,
            })));
        } else {
            // Log a warning and handle non-array data appropriately
            console.warn('Expected inventory data to be an array, but received:', typeof inventorydata);
            // Optionally handle unexpected data formats or errors
            // setInventoryItems([]); // Clearing or setting default data
        }
    }, [inventorydata]);

    return inventoryItems;
};

export default useFetchInventory;
