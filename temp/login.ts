import { useEffect, useState } from "react";
import { getCredentials } from "../util/logincache";
import { router } from "expo-router";

export const userNAME = "Test";
export const passWORD = "Testing123!";

//   // Fetch username from secure storage

// const [userNAME, setUsername] = useState("");
// useEffect(() => {
//     const fetchCredentials = async () => {
//       const credentials = await getCredentials();
//       if (credentials) {
//         setUsername(credentials.username);
//         console.log('logged in with user:', credentials.username, ':fetched from cache');
//       } else {
//         console.log('Credentials not found, please log in');
//         // Optionally redirect to login page
//         router.navigate("/login");
//       }
//     };
  
//     fetchCredentials();
//   }, []);