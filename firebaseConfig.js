import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCv8blqLv3NaB7BFaeNZgQrNpkSVgrOM1w",
  authDomain: "inventory-417bf.firebaseapp.com",
  projectId: "inventory-417bf",
  storageBucket: "inventory-417bf.firebasestorage.app",
  messagingSenderId: "560389172767",
  appId: "1:560389172767:web:3d09e8b9fd2fde54e66f2a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);