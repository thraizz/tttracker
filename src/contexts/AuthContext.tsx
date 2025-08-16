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
import { pwaAuthService } from '../services/pwaAuthService';

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const previousUser = auth.currentUser;
      setUser(user);
      setLoading(false);

      // Clear PWA cache when auth state changes significantly
      if (pwaAuthService.isPWAEnvironment()) {
        const authStateChanged = (
          (!previousUser && user) || 
          (previousUser && !user) || 
          (previousUser?.isAnonymous !== user?.isAnonymous) ||
          (previousUser?.uid !== user?.uid)
        );

        if (authStateChanged) {
          try {
            await pwaAuthService.clearPWAAuthCache();
            console.log('PWA auth cache cleared due to auth state change');
          } catch (error) {
            console.error('Failed to clear PWA auth cache:', error);
          }
        }
      }

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
      
      // First get Google credential via popup
      const result = await signInWithPopup(auth, provider);
      const googleCredential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!googleCredential) {
        throw new Error('Failed to get Google credential');
      }

      // Sign out the Google user to restore anonymous state
      await firebaseSignOut(auth);
      
      // Wait for auth state to restore to anonymous
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user?.isAnonymous) {
            unsubscribe();
            resolve(user);
          }
        });
      });

      // Now properly link the anonymous account with Google credential
      const linkedUser = await linkWithCredential(auth.currentUser!, googleCredential);
      
      // Successful link - migrate data
      await storageService.migrateLocalDataToCloud();
      await userProfileService.migrateAnonymousProfile(linkedUser.user.uid);
      
      return { success: true };
    } catch (error: unknown) {
      console.error('Error upgrading to Google auth:', error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/credential-already-in-use') {
          // Google account already exists - user needs to choose merge or keep separate
          return { 
            success: false, 
            requiresMerge: true,
            existingUser: 'customData' in error ? (error as any).customData?.user : undefined
          };
        } else if (error.code === 'auth/email-already-in-use') {
          // Similar case but different error code
          return { 
            success: false, 
            requiresMerge: true,
            existingUser: undefined
          };
        }
      }
      
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear PWA cache before signing out
      if (pwaAuthService.isPWAEnvironment()) {
        await pwaAuthService.clearPWAAuthCache();
      }
      
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