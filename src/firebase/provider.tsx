'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from 'firebase/app';
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  type Auth,
  type User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFunctions,
  type Functions,
} from 'firebase/functions';

import { firebaseConfig } from '@/firebase/config';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

/** -------------------------------------------------------------------
 *  Context Interfaces
 *  ------------------------------------------------------------------- */
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  functions: Functions | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/** -------------------------------------------------------------------
 *  Local initialization (no circular deps)
 *  ------------------------------------------------------------------- */
function initFirebaseCore() {
  let app: FirebaseApp;

  if (!getApps().length) {
    try {
      // On Hosting, Firebase can inject config
      // @ts-ignore
      app = initializeApp();
    } catch {
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const functions = getFunctions(app, 'us-central1');

  return { app, auth, firestore, functions };
}

/** -------------------------------------------------------------------
 *  Create Context
 *  ------------------------------------------------------------------- */
export const FirebaseContext = createContext<FirebaseContextState | undefined>(
  undefined
);

/** -------------------------------------------------------------------
 *  FirebaseProvider
 *  ------------------------------------------------------------------- */
export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const { app: firebaseApp, auth, firestore, functions } = initFirebaseCore();

  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  // --- Auth listener ---
  useEffect(() => {
    if (!auth) {
      setUserAuthState({
        user: null,
        isUserLoading: false,
        userError: new Error('Auth service not provided.'),
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({
          user: firebaseUser,
          isUserLoading: false,
          userError: null,
        });
      },
      (error) => {
        console.error('FirebaseProvider: onAuthStateChanged error:', error);
        setUserAuthState({
          user: null,
          isUserLoading: false,
          userError: error,
        });
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo<FirebaseContextState>(() => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && functions);

    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      functions: servicesAvailable ? functions : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, functions, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/** -------------------------------------------------------------------
 *  Custom Hooks
 *  ------------------------------------------------------------------- */
export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  if (!auth) throw new Error('Auth not available.');
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firestore not available.');
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) throw new Error('Firebase App not available.');
  return firebaseApp;
};

export const useFirebaseUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
