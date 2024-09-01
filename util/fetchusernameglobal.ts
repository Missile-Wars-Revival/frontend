import { useEffect, useState } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export const useUserName = () => {
    const [userNAME, setUserName] = useState<string>("load failed");

    useEffect(() => {
        const fetchCredentials = async () => {
            const token = await SecureStore.getItemAsync("token");
            if (token) {
                const user = await SecureStore.getItemAsync("username");
                if (user) {
                    setUserName(user);
                } else {
                    console.log('Username not found');
                    setUserName("Unknown User");
                }
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