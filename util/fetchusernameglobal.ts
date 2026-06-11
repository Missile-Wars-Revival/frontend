import { useEffect, useState } from "react";
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
                // signOut relaunches the app shell back to splash → onboarding → login.
                await signOut();
            }
        };

        fetchCredentials();
    }, [signOut]);

    return userNAME;
};