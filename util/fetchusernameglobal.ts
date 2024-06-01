//export const userNAME = "Test2";

//export const passWORD = "Testing123!";


import { useEffect, useState } from "react";
import { getCredentials } from "./logincache";
import { router } from "expo-router";

export const useUserName = () => {
    const [userNAME, setUserName] = useState<string | null>(null);

    useEffect(() => {
        const fetchCredentials = async () => {
            const credentials = await getCredentials();
            if (credentials) {
                setUserName(credentials.username);
                console.log('logged in with user:', credentials.username, ':fetched from cache');
            } else {
                console.log('Credentials not found, please log in');
                // Optionally redirect to login page
                router.navigate("/login");
            }
        };

        fetchCredentials();
    }, []);

    return userNAME;
};

