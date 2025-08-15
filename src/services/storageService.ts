import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';

export interface StorageService {
  save: (key: string, data: unknown) => Promise<void>;
  load: (key: string) => Promise<unknown>;
  remove: (key: string) => Promise<void>;
  isAnonymous: () => boolean;
}

class UnifiedStorageService implements StorageService {
  isAnonymous(): boolean {
    return auth.currentUser?.isAnonymous ?? true;
  }

  async save(key: string, data: unknown): Promise<void> {
    if (this.isAnonymous()) {
      this.saveLocal(key, data);
    } else {
      await this.saveCloud(key, data);
    }
  }

  async load(key: string): Promise<unknown> {
    if (this.isAnonymous()) {
      return this.loadLocal(key);
    } else {
      return await this.loadCloud(key);
    }
  }

  async remove(key: string): Promise<void> {
    if (this.isAnonymous()) {
      this.removeLocal(key);
    } else {
      await this.removeCloud(key);
    }
  }

  private saveLocal(key: string, data: unknown): void {
    try {
      const serialized = JSON.stringify(data, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadLocal(key: string): unknown {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      return JSON.parse(item, (key, value) => {
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  private removeLocal(key: string): void {
    localStorage.removeItem(key);
  }

  private async saveCloud(key: string, data: unknown): Promise<void> {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;

    try {
      const userDocRef = doc(db, 'userData', user.uid);
      await setDoc(userDocRef, { [key]: data }, { merge: true });
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      // Fallback to localStorage on error
      this.saveLocal(key, data);
    }
  }

  private async loadCloud(key: string): Promise<unknown> {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return null;

    try {
      const userDocRef = doc(db, 'userData', user.uid);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data[key] || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading from Firestore:', error);
      // Fallback to localStorage on error
      return this.loadLocal(key);
    }
  }

  private async removeCloud(key: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;

    try {
      const userDocRef = doc(db, 'userData', user.uid);
      await updateDoc(userDocRef, { [key]: null });
    } catch (error) {
      console.error('Error removing from Firestore:', error);
    }
  }

  // Migration helper for upgrading anonymous to Google auth
  async migrateLocalDataToCloud(): Promise<void> {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;

    const keysToMigrate = [
      'players',
      'currentTournament', 
      'mmrMatches',
      'userPreferences',
      'groupMemberships'
    ];

    for (const key of keysToMigrate) {
      const localData = this.loadLocal(key);
      if (localData) {
        await this.saveCloud(key, localData);
        // Keep local copy as backup during transition
      }
    }
  }
}

export const storageService = new UnifiedStorageService();