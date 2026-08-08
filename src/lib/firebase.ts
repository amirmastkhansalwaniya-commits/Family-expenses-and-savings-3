import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc,
  getDoc,
  getDocs,
  deleteField,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyAYXQGOUgWp4kmXHNOQxutlgk9_xgaGncs",
  authDomain: "my-family-app-4a728.firebaseapp.com",
  projectId: "my-family-app-4a728",
  storageBucket: "my-family-app-4a728.firebasestorage.app",
  messagingSenderId: "639887651286",
  appId: "1:639887651286:web:84bc654385db566a02b477"
};
// Silence non-fatal Firestore network warnings in iframe preview & offline states
try {
  setLogLevel('error');
} catch {
  // Ignore if setLogLevel fails
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Safe Firestore initialization with auto-detect long-polling for mobile browsers & restricted iframe environments
let dbInstance;
try {
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, dbId || undefined);
} catch (e) {
  console.warn("Custom Firestore initialization fallback:", e);
  dbInstance = (firebaseConfig as any).firestoreDatabaseId 
    ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;

export { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc,
  getDoc,
  getDocs,
  deleteField,
  Timestamp,
  serverTimestamp
};
