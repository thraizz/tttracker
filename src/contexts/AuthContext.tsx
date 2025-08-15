import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  AuthCredential
} from 'firebase/auth';
import { auth } from '../firebase';
import { storageService } from '../services/storageService';
import { userProfileService } from '../services/userProfileService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  signInAnonymous: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  upgradeToGoogle: () => Promise<{ success: boolean; requiresMerge?: boolean; existingUser?: User }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      // Auto sign in anonymously if no user
      if (!user) {
        signInAnonymously(auth).catch(console.error);
      }
    });

    return unsubscribe;
  }, []);

  const signInAnonymous = useCallback(async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }, []);

  const upgradeToGoogle = useCallback(async (): Promise<{ success: boolean; requiresMerge?: boolean; existingUser?: User }> => {
    const anonymousUser = auth.currentUser;
    if (!anonymousUser || !anonymousUser.isAnonymous) {
      throw new Error('User is not anonymous');
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      // Try to link the anonymous account with Google
      const result = await signInWithPopup(auth, provider);
      
      // Successful link - migrate data
      await storageService.migrateLocalDataToCloud();
      await userProfileService.migrateAnonymousProfile(result.user.uid);
      
      return { success: true };
    } catch (error: unknown) {
      console.error('Error upgrading to Google auth:', error);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/credential-already-in-use') {
        // Google account already exists - user needs to choose merge or keep separate
        return { 
          success: false, 
          requiresMerge: true,
          existingUser: 'customData' in error ? (error as any).customData?.user : undefined
        };
      }
      
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    isAnonymous: user?.isAnonymous || false,
    signInAnonymous,
    signInWithGoogle,
    upgradeToGoogle,
    signOut
  }), [user, loading, signInAnonymous, signInWithGoogle, upgradeToGoogle, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};