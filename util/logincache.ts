// import SecureStorage from 'react-native-secure-storage';

// export async function saveCredentials(username: string, password: string) {
//     try {
//       await SecureStorage.setItem('username', username);
//       await SecureStorage.setItem('password', password);
//     } catch (error) {
//       console.error('Failed to save credentials', error);
//     }
//   }

// //fetching credentials
// export async function getCredentials() {
//   try {
//     const username = await SecureStorage.getItem('username');
//     const password = await SecureStorage.getItem('password');

//     if (username && password) {
//       return { username, password };
//     } else {
//       // Handle the case where credentials are not found
//       console.log('No credentials stored');
//       return null;
//     }
//   } catch (error) {
//     console.error('Failed to fetch credentials', error);
//     return null;
//   }
// }