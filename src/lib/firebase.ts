import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
  getDocFromServer,
  deleteField,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence non-fatal Firestore network connection warnings in iframe preview & offline states
try {
  setLogLevel('silent');
} catch {
  // Ignore if setLogLevel fails
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with anonymous session fallback
export const auth = getAuth(app);

let authPromise: Promise<any> | null = null;

export async function ensureAuthUser() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!authPromise) {
    authPromise = signInAnonymously(auth)
      .then((cred) => {
        console.log('[Firebase Auth] Signed in anonymously. UID:', cred.user.uid);
        return cred.user;
      })
      .catch((err) => {
        console.warn('[Firebase Auth] Anonymous sign-in skipped or restricted:', err?.code || err?.message || err);
        authPromise = null;
        return null;
      });
  }

  return authPromise;
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('[Firebase Auth] Auth state active for user UID:', user.uid);
  }
});

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

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection check: operating in persistent offline mode.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(p => ({
        providerId: p.providerId,
        email: p.email
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

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



