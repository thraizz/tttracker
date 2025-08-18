import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  linkWithPopup,
  AuthCredential,
  signInWithCredential
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
  upgradeToGoogle: () => Promise<{ success: boolean; requiresMerge?: boolean; existingUser?: User; credential?: AuthCredential }>;
  signOut: () => Promise<void>;
  signInWithExistingGoogle: (credential: AuthCredential) => Promise<void>;
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

  const upgradeToGoogle = useCallback(async (): Promise<{ success: boolean; requiresMerge?: boolean; existingUser?: User; credential?: AuthCredential }> => {
    const anonymousUser = auth.currentUser;
    if (!anonymousUser || !anonymousUser.isAnonymous) {
      throw new Error('User is not anonymous');
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      // Link anonymous user with Google credential directly
      try {
        const linkedUser = await linkWithPopup(auth.currentUser!, provider);

        // Successful link - migrate data
        await storageService.migrateLocalDataToCloud();
        await userProfileService.migrateAnonymousProfile(linkedUser.user.uid);

        return { success: true };
      } catch (popupError: unknown) {
        // Check if this is a credential conflict error
        if (popupError && typeof popupError === 'object' && 'code' in popupError) {
          if (popupError.code === 'auth/credential-already-in-use') {
            // Google account already exists - user needs to choose merge or keep separate
            // Extract the existing user info from the error
            const existingUser = (popupError as { customData?: { user?: User } }).customData?.user;

            return {
              success: false,
              requiresMerge: true,
              existingUser,
              credential: undefined
            };
          } else if (popupError.code === 'auth/email-already-in-use') {
            // Similar case but different error code
            return {
              success: false,
              requiresMerge: true,
              existingUser: undefined,
              credential: undefined
            };
          } else if (popupError.code === 'auth/popup-closed-by-user') {
            // User closed the popup
            throw new Error('Google sign-in was cancelled');
          } else if (popupError.code === 'auth/popup-blocked') {
            // Popup was blocked
            throw new Error('Google sign-in popup was blocked. Please allow popups for this site.');
          }
        }

        // Re-throw the error if it's not a credential conflict
        throw popupError;
      }
    } catch (error: unknown) {
      console.error('Error upgrading to Google auth:', error);
      throw error;
    }
  }, []);

  const signInWithExistingGoogle = useCallback(async (credential: AuthCredential): Promise<void> => {
    try {
      // Sign in with the existing Google account using the credential
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Error signing in with existing Google account:', error);
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
    signOut,
    signInWithExistingGoogle
  }), [user, loading, signInAnonymous, signInWithGoogle, upgradeToGoogle, signOut, signInWithExistingGoogle]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};