import { useEffect, useState } from 'react';

import Constants from "expo-constants";

const uri = Constants?.expoConfig?.hostUri
    ? `http://` + Constants.expoConfig.hostUri.split(`:`).shift()?.concat(`:3000`)
    : `missilewars.com`;



export default function useNearby(username: string, latitude: number, longitude: number) {
    // get body
    fetch(uri + '/api/nearby', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            latitude: latitude,
            longitude: longitude,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });


}
