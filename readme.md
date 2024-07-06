# This is the repository for the Missile Wars App
The official frontend for Missile Wars 
A React Native app with Expo

## Running the frontend

Make sure to install all dependencies before proceeding:

```
npm i
```
Make sure to run the backend server before running.

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
Ensure it is using Expo go after `npm start`.
Check:
```
Using development build
› Press s │ switch to Expo Go
```
Just type `s` to resolve :)

## Login 
To login in to an account use either: 
`Test` or `Test2`
Password: is `Testing123!`

## Build 
## Pre-Build:
- `npx expo prebuild --platform ios`

### For Preview:
- `eas build --profile preview --platform all` or `eas build --profile preview --platform ios`

### For Development:
- `eas build --profile development --platform all` or `eas build --profile development --platform ios`