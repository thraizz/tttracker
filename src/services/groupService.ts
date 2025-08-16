import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Group, GroupInvite, Player, Tournament, MMRMatch } from '../types/tournament';
import { userProfileService } from './userProfileService';
import { storageService } from './storageService';

// Types for Firebase data conversion
interface FirebaseData {
  createdAt?: { toDate: () => Date };
  mmrMatches?: FirebaseMatch[];
  tournaments?: FirebaseTournament[];
  [key: string]: unknown;
}

interface FirebaseMatch {
  completedAt?: { toDate: () => Date } | string | Date;
  [key: string]: unknown;
}

interface FirebaseTournament {
  createdAt?: { toDate: () => Date } | string | Date;
  completedAt?: { toDate: () => Date } | string | Date;
  matches?: FirebaseMatch[];
  [key: string]: unknown;
}

const GROUPS_COLLECTION = 'groups';
const GROUP_INVITES_COLLECTION = 'groupInvites';

// Helper function to cache group memberships for anonymous users
const cacheGroupMembershipForAnonymous = async (groupId: string): Promise<void> => {
  const existingMemberships = await storageService.load('groupMemberships') || [];
  if (!existingMemberships.includes(groupId)) {
    existingMemberships.push(groupId);
    await storageService.save('groupMemberships', existingMemberships);
  }
};

export const createGroup = async (
  groupData: Omit<Group, 'id' | 'createdAt'>,
  userId: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, GROUPS_COLLECTION), {
    ...groupData,
    createdBy: userId,
    createdAt: serverTimestamp(),
    members: [userId]
  });
  
  return docRef.id;
};

export const getGroup = async (groupId: string): Promise<Group | null> => {
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data() as FirebaseData;
    
    // Convert dates in nested objects
    const processedData = {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      mmrMatches: data.mmrMatches?.map((match: FirebaseMatch) => ({
        ...match,
        completedAt: match.completedAt?.toDate ? match.completedAt.toDate() : new Date(match.completedAt || new Date())
      })) || [],
      tournaments: data.tournaments?.map((tournament: FirebaseTournament) => ({
        ...tournament,
        createdAt: tournament.createdAt?.toDate ? tournament.createdAt.toDate() : new Date(tournament.createdAt || new Date()),
        completedAt: tournament.completedAt?.toDate ? tournament.completedAt.toDate() : tournament.completedAt ? new Date(tournament.completedAt) : undefined,
        matches: tournament.matches?.map((match: FirebaseMatch) => ({
          ...match,
          completedAt: match.completedAt?.toDate ? match.completedAt.toDate() : match.completedAt ? new Date(match.completedAt) : undefined
        })) || []
      })) || []
    };
    
    return {
      id: docSnap.id,
      ...processedData
    } as Group;
  }
  
  return null;
};

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  const q = query(
    collection(db, GROUPS_COLLECTION),
    where('members', 'array-contains', userId)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as FirebaseData;
    
    // Convert dates in nested objects
    const processedData = {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      mmrMatches: data.mmrMatches?.map((match: FirebaseMatch) => ({
        ...match,
        completedAt: match.completedAt?.toDate ? match.completedAt.toDate() : new Date(match.completedAt || new Date())
      })) || [],
      tournaments: data.tournaments?.map((tournament: FirebaseTournament) => ({
        ...tournament,
        createdAt: tournament.createdAt?.toDate ? tournament.createdAt.toDate() : new Date(tournament.createdAt || new Date()),
        completedAt: tournament.completedAt?.toDate ? tournament.completedAt.toDate() : tournament.completedAt ? new Date(tournament.completedAt) : undefined,
        matches: tournament.matches?.map((match: FirebaseMatch) => ({
          ...match,
          completedAt: match.completedAt?.toDate ? match.completedAt.toDate() : match.completedAt ? new Date(match.completedAt) : undefined
        })) || []
      })) || []
    };
    
    return {
      id: doc.id,
      ...processedData
    } as Group;
  });
};

export const getPublicGroups = async (userId?: string): Promise<Group[]> => {
  const q = query(
    collection(db, GROUPS_COLLECTION),
    where('settings.allowPublicJoin', '==', true)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => {
      const data = doc.data() as FirebaseData;
      
      // Convert dates in nested objects
      const processedData = {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        mmrMatches: data.mmrMatches?.map((match: FirebaseMatch) => ({
          ...match,
          completedAt: match.completedAt?.toDate ? match.completedAt.toDate() : new Date(match.completedAt || new Date())
        })) || [],
        tournaments: data.tournaments?.map((tournament: FirebaseTournament) => ({
          ...tournament,
          createdAt: tournament.createdAt?.toDate ? tournament.createdAt.toDate() : new Date(tournament.createdAt || new Date()),
          completedAt: tournament.completedAt?.toDate ? tournament.completedAt.toDate() : tournament.completedAt ? new Date(tournament.completedAt) : undefined,
          matches: tournament.matches?.map((match: FirebaseMatch) => ({
            ...match,
            completedAt: match.completedAt?.toDate ? match.completedAt.toDate() : match.completedAt ? new Date(match.completedAt) : undefined
          })) || []
        })) || []
      };
      
      return {
        id: doc.id,
        ...processedData
      } as Group;
    })
    .filter(group => !userId || !group.members.includes(userId)); // Exclude groups user is already a member of
};

export const joinGroup = async (groupId: string, userId: string, playerName?: string): Promise<void> => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  
  // Get current group data to check if player already exists
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) {
    throw new Error('Group not found');
  }
  
  const groupData = groupSnap.data();
  const existingPlayerById = groupData.players?.find((player: Player) => player.id === userId);
  
  const updates: Record<string, unknown> = {
    members: arrayUnion(userId)
  };
  
  // If player doesn't exist by ID and we have a name, check for existing player by name
  if (!existingPlayerById && playerName) {
    const existingPlayerByName = groupData.players?.find((player: Player) => 
      player.name.toLowerCase() === playerName.toLowerCase() && player.isAnonymous
    );
    
    const user = auth.currentUser;
    
    if (existingPlayerByName) {
      // Link existing anonymous player to the new account
      const updatedPlayer = { ...existingPlayerByName, id: userId, isAnonymous: false };
      const updatedPlayers = groupData.players?.map((player: Player) => 
        player.id === existingPlayerByName.id 
          ? updatedPlayer
          : player
      ) || [];
      
      // Update player references in tournaments
      const updatedTournaments = groupData.tournaments?.map((tournament: Tournament) => ({
        ...tournament,
        players: tournament.players.map(player => 
          player.id === existingPlayerByName.id ? updatedPlayer : player
        ),
        matches: tournament.matches.map(match => ({
          ...match,
          player1: match.player1?.id === existingPlayerByName.id ? updatedPlayer : match.player1,
          player2: match.player2?.id === existingPlayerByName.id ? updatedPlayer : match.player2,
          winner: match.winner?.id === existingPlayerByName.id ? updatedPlayer : match.winner
        })),
        winner: tournament.winner?.id === existingPlayerByName.id ? updatedPlayer : tournament.winner
      })) || [];
      
      // Update player references in MMR matches
      const updatedMmrMatches = groupData.mmrMatches?.map((match: MMRMatch) => ({
        ...match,
        player1: match.player1.id === existingPlayerByName.id ? updatedPlayer : match.player1,
        player2: match.player2.id === existingPlayerByName.id ? updatedPlayer : match.player2,
        winner: match.winner.id === existingPlayerByName.id ? updatedPlayer : match.winner
      })) || [];
      
      updates.players = updatedPlayers;
      updates.tournaments = updatedTournaments;
      updates.mmrMatches = updatedMmrMatches;
    } else {
      // Create new player profile
      const newPlayer = {
        id: userId,
        name: playerName,
        wins: 0,
        losses: 0,
        mmr: 1000,
        peakMmr: 1000,
        isAnonymous: user?.isAnonymous || false
      };
      
      updates.players = arrayUnion(newPlayer);
    }
    
    // Record name usage for smart suggestions
    await userProfileService.recordNameUsage(playerName, groupData.name);
    
    // Cache group membership for anonymous users
    if (user?.isAnonymous) {
      await cacheGroupMembershipForAnonymous(groupId);
    }
  }
  
  await updateDoc(groupRef, updates);
};

export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(groupRef, {
    members: arrayRemove(userId)
  });
};

export const updateGroup = async (groupId: string, updates: Partial<Group>): Promise<void> => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(groupRef, updates);
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  await deleteDoc(doc(db, GROUPS_COLLECTION, groupId));
};

export const createGroupInvite = async (
  groupId: string, 
  groupName: string,
  userId: string,
  options?: {
    expiresAt?: Date;
    usageLimit?: number;
  }
): Promise<string> => {
  const inviteData = {
    groupId,
    groupName,
    createdBy: userId,
    createdAt: serverTimestamp(),
    usedCount: 0,
    ...(options?.expiresAt && { expiresAt: Timestamp.fromDate(options.expiresAt) }),
    ...(options?.usageLimit && { usageLimit: options.usageLimit })
  };
  
  const docRef = await addDoc(collection(db, GROUP_INVITES_COLLECTION), inviteData);
  return docRef.id;
};

export const getGroupInvite = async (inviteId: string): Promise<GroupInvite | null> => {
  const docRef = doc(db, GROUP_INVITES_COLLECTION, inviteId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      ...(data.expiresAt && { expiresAt: data.expiresAt.toDate() })
    } as GroupInvite;
  }
  
  return null;
};

export const consumeGroupInvite = async (inviteId: string): Promise<void> => {
  const inviteRef = doc(db, GROUP_INVITES_COLLECTION, inviteId);
  const inviteSnap = await getDoc(inviteRef);
  
  if (!inviteSnap.exists()) {
    throw new Error('Invite not found');
  }
  
  const invite = inviteSnap.data();
  
  if (invite.expiresAt && invite.expiresAt.toDate() < new Date()) {
    throw new Error('Invite has expired');
  }
  
  if (invite.usageLimit && invite.usedCount >= invite.usageLimit) {
    throw new Error('Invite usage limit reached');
  }
  
  await updateDoc(inviteRef, {
    usedCount: invite.usedCount + 1
  });
};

export const subscribeToGroup = (
  groupId: string, 
  callback: (group: Group | null) => void
): (() => void) => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  
  return onSnapshot(groupRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data() as FirebaseData;
      
      // Convert dates in nested objects
      const processedData = {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        mmrMatches: data.mmrMatches?.map((match: FirebaseMatch) => ({
          ...match,
          completedAt: match.completedAt?.toDate ? match.completedAt.toDate() : new Date(match.completedAt || new Date())
        })) || [],
        tournaments: data.tournaments?.map((tournament: FirebaseTournament) => ({
          ...tournament,
          createdAt: tournament.createdAt?.toDate ? tournament.createdAt.toDate() : new Date(tournament.createdAt || new Date()),
          completedAt: tournament.completedAt?.toDate ? tournament.completedAt.toDate() : tournament.completedAt ? new Date(tournament.completedAt) : undefined,
          matches: tournament.matches?.map((match: FirebaseMatch) => ({
            ...match,
            completedAt: match.completedAt?.toDate ? match.completedAt.toDate() : match.completedAt ? new Date(match.completedAt) : undefined
          })) || []
        })) || []
      };
      
      callback({
        id: doc.id,
        ...processedData
      } as Group);
    } else {
      callback(null);
    }
  });
};