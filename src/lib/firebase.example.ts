import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC0F5uLFOhVc3PFaH4s09qzG9Hvgs0NGaM",
  authDomain: "runbuddy-cb820.firebaseapp.com",
  projectId: "runbuddy-cb820",
  storageBucket: "runbuddy-cb820.firebasestorage.app",
  messagingSenderId: "814258538909",
  appId: "1:814258538909:web:cd918714657101f6898774",
  measurementId: "G-FVELCV55MW"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
