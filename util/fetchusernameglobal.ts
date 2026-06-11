import { useEffect, useState } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "./Context/authcontext";

export const useUserName = () => {
    const [userNAME, setUserName] = useState<string>("load failed");
    const { signOut } = useAuth();

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
                await signOut();
                router.navigate("/login");
            }
        };

        fetchCredentials();
    }, [signOut]);

    return userNAME;
};