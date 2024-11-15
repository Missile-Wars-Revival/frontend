import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/database';

export const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  };

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
export const database = firebase.database();
export const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;
export default firebase;