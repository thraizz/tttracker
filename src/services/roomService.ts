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
import { db } from '../firebase';
import { Room, RoomInvite } from '../types/tournament';

const ROOMS_COLLECTION = 'rooms';
const ROOM_INVITES_COLLECTION = 'roomInvites';

export const createRoom = async (
  roomData: Omit<Room, 'id' | 'createdAt'>,
  userId: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, ROOMS_COLLECTION), {
    ...roomData,
    createdBy: userId,
    createdAt: serverTimestamp(),
    members: [userId]
  });
  
  return docRef.id;
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  const docRef = doc(db, ROOMS_COLLECTION, roomId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    } as Room;
  }
  
  return null;
};

export const getUserRooms = async (userId: string): Promise<Room[]> => {
  const q = query(
    collection(db, ROOMS_COLLECTION),
    where('members', 'array-contains', userId)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as Room[];
};

export const joinRoom = async (roomId: string, userId: string): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, {
    members: arrayUnion(userId)
  });
};

export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, {
    members: arrayRemove(userId)
  });
};

export const updateRoom = async (roomId: string, updates: Partial<Room>): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, updates);
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
};

export const createRoomInvite = async (
  roomId: string, 
  roomName: string,
  userId: string,
  options?: {
    expiresAt?: Date;
    usageLimit?: number;
  }
): Promise<string> => {
  const inviteData = {
    roomId,
    roomName,
    createdBy: userId,
    createdAt: serverTimestamp(),
    usedCount: 0,
    ...(options?.expiresAt && { expiresAt: Timestamp.fromDate(options.expiresAt) }),
    ...(options?.usageLimit && { usageLimit: options.usageLimit })
  };
  
  const docRef = await addDoc(collection(db, ROOM_INVITES_COLLECTION), inviteData);
  return docRef.id;
};

export const getRoomInvite = async (inviteId: string): Promise<RoomInvite | null> => {
  const docRef = doc(db, ROOM_INVITES_COLLECTION, inviteId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      ...(data.expiresAt && { expiresAt: data.expiresAt.toDate() })
    } as RoomInvite;
  }
  
  return null;
};

export const consumeRoomInvite = async (inviteId: string): Promise<void> => {
  const inviteRef = doc(db, ROOM_INVITES_COLLECTION, inviteId);
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

export const subscribeToRoom = (
  roomId: string, 
  callback: (room: Room | null) => void
): (() => void) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Room);
    } else {
      callback(null);
    }
  });
};