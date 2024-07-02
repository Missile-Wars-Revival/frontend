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

export const useToken = () => {
    const [token, setToken] = useState<string | any>();

    useEffect(() => {
        const fetchCredentials = async () => {
            const credentials = await getCredentials();
            if (credentials) {
                setToken(credentials.token);
                //console.log('logged in with user token:', credentials.token, ':fetched from cache');
            } else {
                console.log('Credentials not found, please log in');
                // Optionally redirect to login page
                router.navigate("/login");
            }
        };

        fetchCredentials();
    }, []);

    return token;
};

