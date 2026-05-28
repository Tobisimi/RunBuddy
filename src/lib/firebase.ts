import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Replace with your own Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBMM_k70-nbYWwzwIpX0h5CIfbZBDG9id4",
  authDomain: "runbuddy-6ba14.firebaseapp.com",
  projectId: "runbuddy-6ba14",
  storageBucket: "runbuddy-6ba14.firebasestorage.app",
  messagingSenderId: "788885648756",
  appId: "1:788885648756:web:faea0a055bdd0d4a6a2821",
  measurementId: "G-SDJMDWGPH6",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
