import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA2-h6Ec1-rQC6C1ujQEwU-Z6Ph2E3OXrk",
  authDomain: "groupchats-44023.firebaseapp.com",
  databaseURL: "https://groupchats-44023-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "groupchats-44023",
  storageBucket: "groupchats-44023.firebasestorage.app",
  messagingSenderId: "31744707011",
  appId: "1:31744707011:web:91011f9821a3f6e6e5d576",
  measurementId: "G-LTR8GWL0T0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});