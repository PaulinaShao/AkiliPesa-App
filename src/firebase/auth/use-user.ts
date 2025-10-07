'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useUser() {
  const auth = useAuth();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    if (auth === null) {
      setState({ user: null, loading: false });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false });
    });

    return () => {
      unsubscribe();
    };
  }, [auth]);

  return state;
}
