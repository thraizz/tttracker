import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMRdv3_nyNmdQ1Kl1vVKEvwESwC6Pxi28",
  authDomain: "tttracker-9b5ad.firebaseapp.com",
  projectId: "tttracker-9b5ad",
  storageBucket: "tttracker-9b5ad.firebasestorage.app",
  messagingSenderId: "547891585614",
  appId: "1:547891585614:web:2c0777c62d47589a65d91f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (error) {
    // Emulators already connected
  }
}

export default app;