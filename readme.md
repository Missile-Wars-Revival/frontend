# This is the repository for the Missile Wars App
The official frontend for Missile Wars 
A React Native app with Expo

## Running the frontend

Ensure npm is installed: <br />
https://nodejs.org/en/download/prebuilt-installer

Make sure to install all dependencies before proceeding: <br />
```
npm i
```

Make sure to run the backend server before running!

## Update the .env
Update this with your ip address:
```
EXPO_PUBLIC_WEBSOCKET_URL
```

## To build and run:

```
npm start
```

## Using Expo Go:
Ensure it is using Expo go after `npm start`. <br />
Check: <br />
```
Using development build
› Press s │ switch to Expo Go
```
Just type `s` to resolve :)

## Login 
To login in to an account use either: <br />
Username: `Test` or `Test2` <br />
Password: `Testing123!` <br />


## Notification Test:
```
https://expo.dev/notifications
```

# Building:
To send the build to EAS build run the following commands: <br />
*Note: You will need the companies Apple login for iOS builds - Contact Tristan in Discord for this*
## Pre-Build
`npx expo prebuild --platform ios`  <br />
*Note: Unless developing native code this is unnecessary*  <br />

### For Preview:
`eas build --profile preview --platform all` <br />
or <br />
`eas build --profile preview --platform ios` <br />

### For Development:
`eas build --profile development --platform all` <br />
or <br />
`eas build --profile development --platform ios` <br />

### For Production:
`eas build --profile production --platform all` <br />
or <br />
`eas build --profile production --platform ios` <br />

### Submit to App store:
`eas submit --platform ios` <br />
`eas submit --platform android` <br />