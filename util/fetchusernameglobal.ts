import { useEffect, useState } from "react";
import { getCredentials } from "./logincache";
import { router } from "expo-router";

export const useUserName = () => {
    const [userNAME, setUserName] = useState<string>("Test2");

    useEffect(() => {
        const fetchCredentials = async () => {
            const credentials = await getCredentials();
            if (credentials) {
                setUserName(credentials.username);
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