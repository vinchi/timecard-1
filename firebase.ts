import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBGQnhjezXc6thn_qDMvPT8sVBVcnWkS8M",
  authDomain: "timecard-a403b.firebaseapp.com",
  projectId: "timecard-a403b",
  storageBucket: "timecard-a403b.firebasestorage.app",
  messagingSenderId: "756260790114",
  appId: "1:756260790114:web:1c5647e581b8cbe0c8d63b",
  measurementId: "G-7DN5JFHH9W"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
