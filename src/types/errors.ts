export enum AuthErrorCode {
  // Authentication errors
  USER_NOT_AUTHENTICATED = 'USER_NOT_AUTHENTICATED',
  ANONYMOUS_USER_REQUIRED = 'ANONYMOUS_USER_REQUIRED',
  GOOGLE_CREDENTIAL_FAILED = 'GOOGLE_CREDENTIAL_FAILED',
  ACCOUNT_LINKING_FAILED = 'ACCOUNT_LINKING_FAILED',
  CREDENTIAL_ALREADY_IN_USE = 'CREDENTIAL_ALREADY_IN_USE',
  EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE',
  
  // PWA-specific errors
  PWA_AUTH_VALIDATION_FAILED = 'PWA_AUTH_VALIDATION_FAILED',
  PWA_OFFLINE_AUTH_MISMATCH = 'PWA_OFFLINE_AUTH_MISMATCH',
  PWA_STALE_TOKEN = 'PWA_STALE_TOKEN',
  PWA_REFRESH_FAILED = 'PWA_REFRESH_FAILED',
  PWA_CACHE_ERROR = 'PWA_CACHE_ERROR',
  
  // Group operation errors
  GROUP_NOT_FOUND = 'GROUP_NOT_FOUND',
  ALREADY_GROUP_MEMBER = 'ALREADY_GROUP_MEMBER',
  PLAYER_LINKING_FAILED = 'PLAYER_LINKING_FAILED',
  GROUP_JOIN_FAILED = 'GROUP_JOIN_FAILED',
  INVITE_EXPIRED = 'INVITE_EXPIRED',
  INVITE_LIMIT_REACHED = 'INVITE_LIMIT_REACHED',
  
  // Storage errors
  STORAGE_MIGRATION_FAILED = 'STORAGE_MIGRATION_FAILED',
  DATA_SYNC_FAILED = 'DATA_SYNC_FAILED',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface AuthError extends Error {
  code: AuthErrorCode;
  details?: Record<string, unknown>;
  recoverable?: boolean;
  userMessage?: string;
}

export class AuthenticationError extends Error implements AuthError {
  public code: AuthErrorCode;
  public details?: Record<string, unknown>;
  public recoverable?: boolean;
  public userMessage?: string;

  constructor(
    code: AuthErrorCode,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      recoverable?: boolean;
      userMessage?: string;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.details = options?.details;
    this.recoverable = options?.recoverable ?? false;
    this.userMessage = options?.userMessage;
    
    if (options?.cause) {
      this.cause = options.cause;
    }
  }

  static fromFirebaseError(firebaseError: { code: string; message: string }): AuthenticationError {
    switch (firebaseError.code) {
      case 'auth/user-not-found':
      case 'auth/user-disabled':
        return new AuthenticationError(
          AuthErrorCode.USER_NOT_AUTHENTICATED,
          firebaseError.message,
          {
            userMessage: 'Authentication required. Please sign in to continue.',
            recoverable: true
          }
        );
        
      case 'auth/credential-already-in-use':
        return new AuthenticationError(
          AuthErrorCode.CREDENTIAL_ALREADY_IN_USE,
          firebaseError.message,
          {
            userMessage: 'This Google account is already linked to another user.',
            recoverable: true
          }
        );
        
      case 'auth/email-already-in-use':
        return new AuthenticationError(
          AuthErrorCode.EMAIL_ALREADY_IN_USE,
          firebaseError.message,
          {
            userMessage: 'This email is already associated with another account.',
            recoverable: true
          }
        );
        
      case 'auth/network-request-failed':
        return new AuthenticationError(
          AuthErrorCode.NETWORK_ERROR,
          firebaseError.message,
          {
            userMessage: 'Network error. Please check your connection and try again.',
            recoverable: true
          }
        );
        
      default:
        return new AuthenticationError(
          AuthErrorCode.UNKNOWN_ERROR,
          firebaseError.message,
          {
            userMessage: 'An unexpected error occurred. Please try again.',
            recoverable: true,
            details: { originalCode: firebaseError.code }
          }
        );
    }
  }

  static fromPWAError(errorCode: string): AuthenticationError {
    switch (errorCode) {
      case 'PWA_OFFLINE_AUTH_MISMATCH':
        return new AuthenticationError(
          AuthErrorCode.PWA_OFFLINE_AUTH_MISMATCH,
          'Authentication state inconsistent while offline',
          {
            userMessage: 'Please connect to the internet and try again.',
            recoverable: true
          }
        );
        
      case 'PWA_STALE_TOKEN':
        return new AuthenticationError(
          AuthErrorCode.PWA_STALE_TOKEN,
          'Authentication token is stale',
          {
            userMessage: 'Your session has expired. Please refresh and sign in again.',
            recoverable: true
          }
        );
        
      case 'PWA_REFRESH_FAILED':
        return new AuthenticationError(
          AuthErrorCode.PWA_REFRESH_FAILED,
          'Failed to refresh authentication state',
          {
            userMessage: 'Unable to verify your authentication. Please sign in again.',
            recoverable: true
          }
        );
        
      default:
        return new AuthenticationError(
          AuthErrorCode.PWA_AUTH_VALIDATION_FAILED,
          `PWA authentication validation failed: ${errorCode}`,
          {
            userMessage: 'Authentication issue detected. Please try refreshing the app.',
            recoverable: true
          }
        );
    }
  }

  getRetryAction(): string | null {
    switch (this.code) {
      case AuthErrorCode.PWA_STALE_TOKEN:
      case AuthErrorCode.PWA_REFRESH_FAILED:
        return 'refresh_and_signin';
        
      case AuthErrorCode.CREDENTIAL_ALREADY_IN_USE:
      case AuthErrorCode.EMAIL_ALREADY_IN_USE:
        return 'choose_different_account';
        
      case AuthErrorCode.NETWORK_ERROR:
      case AuthErrorCode.PWA_OFFLINE_AUTH_MISMATCH:
        return 'check_connection';
        
      case AuthErrorCode.USER_NOT_AUTHENTICATED:
        return 'sign_in_required';
        
      default:
        return this.recoverable ? 'retry' : null;
    }
  }
}