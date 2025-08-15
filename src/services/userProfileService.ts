import { auth } from '../firebase';
import { storageService } from './storageService';
import { getUserGroups } from './groupService';

export interface UserProfile {
  id: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  defaultPlayerName?: string;
  isAnonymous: boolean;
  createdAt: Date;
  lastActiveAt: Date;
  preferredNames: string[]; // Names used in different groups
}

export interface NameSuggestion {
  name: string;
  source: 'google' | 'saved' | 'previous' | 'manual';
  groupName?: string; // If from previous group
}

class UserProfileService {
  private readonly PROFILE_KEY = 'userProfile';
  private readonly PREFERRED_NAME_KEY = 'preferredPlayerName';

  async getUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;

    let profile = await storageService.load(this.PROFILE_KEY);
    
    // Create profile if it doesn't exist
    if (!profile) {
      profile = this.createDefaultProfile(user);
      await this.saveUserProfile(profile);
    }

    // Update last active
    profile.lastActiveAt = new Date();
    await this.saveUserProfile(profile);

    return profile;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await storageService.save(this.PROFILE_KEY, profile);
  }

  async updateDefaultPlayerName(name: string): Promise<void> {
    const profile = await this.getUserProfile();
    if (profile) {
      profile.defaultPlayerName = name;
      
      // Add to preferred names if not already there
      if (!profile.preferredNames.includes(name)) {
        profile.preferredNames.unshift(name);
        // Keep only last 5 names
        profile.preferredNames = profile.preferredNames.slice(0, 5);
      }
      
      await this.saveUserProfile(profile);
    }

    // Also save to legacy localStorage for immediate access
    localStorage.setItem(this.PREFERRED_NAME_KEY, name);
  }

  async getNameSuggestions(): Promise<NameSuggestion[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const suggestions: NameSuggestion[] = [];
    const seenNames = new Set<string>();

    // 1. Google display name (for non-anonymous users)
    if (!user.isAnonymous && user.displayName && user.displayName.trim()) {
      suggestions.push({
        name: user.displayName,
        source: 'google'
      });
      seenNames.add(user.displayName);
    }

    // 2. Saved default name
    const profile = await this.getUserProfile();
    if (profile?.defaultPlayerName && !seenNames.has(profile.defaultPlayerName)) {
      suggestions.push({
        name: profile.defaultPlayerName,
        source: 'saved'
      });
      seenNames.add(profile.defaultPlayerName);
    }

    // 3. Legacy localStorage preference
    const legacyPreference = localStorage.getItem(this.PREFERRED_NAME_KEY);
    if (legacyPreference && !seenNames.has(legacyPreference)) {
      suggestions.push({
        name: legacyPreference,
        source: 'saved'
      });
      seenNames.add(legacyPreference);
    }

    // 4. Names from other groups
    try {
      const userGroups = await getUserGroups(user.uid);
      for (const group of userGroups) {
        const playerInGroup = group.players?.find(p => p.id === user.uid);
        if (playerInGroup && playerInGroup.name && !seenNames.has(playerInGroup.name)) {
          suggestions.push({
            name: playerInGroup.name,
            source: 'previous',
            groupName: group.name
          });
          seenNames.add(playerInGroup.name);
        }
      }
    } catch (error) {
      console.error('Error fetching user groups for name suggestions:', error);
    }

    // 5. Names from profile history
    if (profile?.preferredNames) {
      for (const name of profile.preferredNames) {
        if (!seenNames.has(name)) {
          suggestions.push({
            name,
            source: 'previous'
          });
          seenNames.add(name);
        }
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  async recordNameUsage(name: string, groupName?: string): Promise<void> {
    const profile = await this.getUserProfile();
    if (!profile) return;

    // Add to preferred names
    if (!profile.preferredNames.includes(name)) {
      profile.preferredNames.unshift(name);
      profile.preferredNames = profile.preferredNames.slice(0, 5);
    }

    // Update default if this is the first time setting a name
    if (!profile.defaultPlayerName) {
      profile.defaultPlayerName = name;
    }

    await this.saveUserProfile(profile);
  }

  private createDefaultProfile(user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null; isAnonymous: boolean }): UserProfile {
    return {
      id: user.uid,
      displayName: user.displayName || undefined,
      email: user.email || undefined,
      avatar: user.photoURL || undefined,
      isAnonymous: user.isAnonymous,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      preferredNames: []
    };
  }

  // Helper for migration from anonymous to Google auth
  async migrateAnonymousProfile(newUserId: string): Promise<void> {
    const currentProfile = await this.getUserProfile();
    if (!currentProfile) return;

    // Update the profile with new user ID
    const migratedProfile: UserProfile = {
      ...currentProfile,
      id: newUserId,
      isAnonymous: false,
      lastActiveAt: new Date()
    };

    // Save under new user ID (this will use Firestore since user is no longer anonymous)
    await this.saveUserProfile(migratedProfile);
  }
}

export const userProfileService = new UserProfileService();