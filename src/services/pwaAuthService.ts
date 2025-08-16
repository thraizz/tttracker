import { auth } from '../firebase';
import { User } from 'firebase/auth';
import { AuthenticationError, AuthErrorCode } from '../types/errors';

export interface PWAAuthValidationResult {
  isValid: boolean;
  needsRefresh?: boolean;
  error?: AuthenticationError;
  user?: User | null;
}

class PWAAuthService {
  private static readonly PWA_AUTH_CHECK_KEY = 'pwa_auth_last_check';
  private static readonly PWA_AUTH_VALIDATION_INTERVAL = 30000; // 30 seconds

  async validateAuthState(): Promise<PWAAuthValidationResult> {
    try {
      const currentUser = auth.currentUser;
      const lastCheck = this.getLastAuthCheck();
      const now = Date.now();

      // Force refresh if it's been too long since last check
      if (now - lastCheck > PWAAuthService.PWA_AUTH_VALIDATION_INTERVAL) {
        await this.refreshAuthState();
        this.setLastAuthCheck(now);
      }

      // Check for PWA-specific auth inconsistencies
      const hasServiceWorker = 'serviceWorker' in navigator;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isPWA || hasServiceWorker) {
        // Additional validation for PWA environment
        const isOnline = navigator.onLine;
        
        if (!isOnline && currentUser && !currentUser.isAnonymous) {
          // Offline with non-anonymous user - potential cache issue
          return {
            isValid: false,
            needsRefresh: true,
            error: AuthenticationError.fromPWAError('PWA_OFFLINE_AUTH_MISMATCH'),
            user: currentUser
          };
        }

        // Check for stale auth tokens in PWA cache
        if (currentUser && await this.hasStaleAuthToken(currentUser)) {
          return {
            isValid: false,
            needsRefresh: true,
            error: AuthenticationError.fromPWAError('PWA_STALE_TOKEN'),
            user: currentUser
          };
        }
      }

      return {
        isValid: true,
        user: currentUser
      };
    } catch (error) {
      console.error('PWA auth validation error:', error);
      return {
        isValid: false,
        error: new AuthenticationError(
          AuthErrorCode.PWA_AUTH_VALIDATION_FAILED,
          'PWA authentication validation failed',
          {
            cause: error instanceof Error ? error : new Error(String(error)),
            userMessage: 'Authentication check failed. Please try refreshing the app.',
            recoverable: true
          }
        ),
        user: null
      };
    }
  }

  async validateBeforeGroupOperation(): Promise<PWAAuthValidationResult> {
    const validation = await this.validateAuthState();
    
    if (!validation.isValid && validation.needsRefresh) {
      try {
        await this.refreshAuthState();
        // Re-validate after refresh
        return await this.validateAuthState();
      } catch (error) {
        console.error('Failed to refresh auth state:', error);
        return {
          isValid: false,
          error: AuthenticationError.fromPWAError('PWA_REFRESH_FAILED'),
          user: validation.user
        };
      }
    }

    return validation;
  }

  private async refreshAuthState(): Promise<void> {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Force token refresh
      await currentUser.getIdToken(true);
    }
  }

  private async hasStaleAuthToken(user: User): Promise<boolean> {
    try {
      const tokenResult = await user.getIdTokenResult();
      const tokenAge = Date.now() - new Date(tokenResult.authTime).getTime();
      
      // Consider token stale if older than 1 hour
      return tokenAge > 3600000;
    } catch (error) {
      console.error('Error checking token staleness:', error);
      return true; // Assume stale on error
    }
  }

  private getLastAuthCheck(): number {
    const stored = localStorage.getItem(PWAAuthService.PWA_AUTH_CHECK_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }

  private setLastAuthCheck(timestamp: number): void {
    localStorage.setItem(PWAAuthService.PWA_AUTH_CHECK_KEY, timestamp.toString());
  }

  async clearPWAAuthCache(): Promise<void> {
    try {
      // Clear service worker caches related to auth
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        const authCaches = cacheNames.filter(name => 
          name.includes('firebase') || 
          name.includes('auth') || 
          name.includes('google')
        );
        
        await Promise.all(authCaches.map(name => caches.delete(name)));
      }

      // Clear localStorage auth check
      localStorage.removeItem(PWAAuthService.PWA_AUTH_CHECK_KEY);
      
      console.log('PWA auth cache cleared');
    } catch (error) {
      console.error('Error clearing PWA auth cache:', error);
    }
  }

  isPWAEnvironment(): boolean {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIOSPWA = isIOS && !window.navigator.standalone;
    
    return hasServiceWorker || isStandalone || isIOSPWA;
  }

  getAuthDiagnostics(): Record<string, unknown> {
    const currentUser = auth.currentUser;
    return {
      isPWA: this.isPWAEnvironment(),
      isOnline: navigator.onLine,
      hasServiceWorker: 'serviceWorker' in navigator,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      userExists: !!currentUser,
      isAnonymous: currentUser?.isAnonymous,
      uid: currentUser?.uid,
      lastAuthCheck: this.getLastAuthCheck(),
      userAgent: navigator.userAgent
    };
  }
}

export const pwaAuthService = new PWAAuthService();