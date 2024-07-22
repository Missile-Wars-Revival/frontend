import { InventoryItem } from "../../types/types";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchInventory = (): InventoryItem[] => {
    const { inventorydata } = useWebSocketContext();
    const [Inventorys, setInventorys] = useState<InventoryItem[]>([]);

    useEffect(() => {
        if (inventorydata) {
            //console.log('Received data:', inventorydata);
            if (Array.isArray(inventorydata)) {
                //console.log('Data is an array:', inventorydata);
                const fetchedInventorys = inventorydata.filter(item => item.itemType === "Inventory");
                if (fetchedInventorys.length > 0) {
                    setInventorys(fetchedInventorys.map(item => item));
                }
            } else if (typeof inventorydata === 'object' && inventorydata.itemType === "Inventory") {
                //console.log('Data is a single Inventory object:', inventorydata);
                setInventorys([inventorydata]);
            } else {
                //console.warn('Data is not an array or a Inventory object:',inventorydata);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [inventorydata]);

    return Inventorys;
};

export default useFetchInventory;
