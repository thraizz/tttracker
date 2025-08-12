import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Room } from '../types/tournament';
import { useAuth } from './AuthContext';
import { getUserRooms, subscribeToRoom, createRoom, joinRoom } from '../services/roomService';

interface RoomContextType {
  currentRoom: Room | null;
  userRooms: Room[];
  loading: boolean;
  setCurrentRoom: (room: Room | null) => void;
  createNewRoom: (name: string, description?: string) => Promise<string>;
  joinRoomById: (roomId: string) => Promise<void>;
  refreshRooms: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

interface RoomProviderProps {
  children: React.ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshRooms = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const rooms = await getUserRooms(user.uid);
      setUserRooms(rooms);

      // If no current room and user has rooms, set the first one as current
      if (!currentRoom && rooms.length > 0) {
        setCurrentRoom(rooms[0]);
      }
    } catch (error) {
      console.error('Error fetching user rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentRoom]);

  const createNewRoom = async (name: string, description?: string): Promise<string> => {
    if (!user) throw new Error('User must be authenticated');

    const roomData = {
      name,
      description: description || '',
      isPublic: false,
      members: [],
      players: [],
      tournaments: [],
      mmrMatches: [],
      settings: {
        allowPublicJoin: false,
        requireApproval: false
      }
    };

    const roomId = await createRoom(roomData, user.uid);
    await refreshRooms();
    return roomId;
  };

  const joinRoomById = async (roomId: string): Promise<void> => {
    if (!user) throw new Error('User must be authenticated');

    await joinRoom(roomId, user.uid);
    await refreshRooms();
  };

  useEffect(() => {
    if (user) {
      refreshRooms();
    }
  }, [user, refreshRooms]);

  // Subscribe to current room updates
  useEffect(() => {
    if (!currentRoom) return;

    const unsubscribe = subscribeToRoom(currentRoom.id, (updatedRoom) => {
      if (updatedRoom) {
        setCurrentRoom(updatedRoom);
        // Update in userRooms as well
        setUserRooms(prev =>
          prev.map(room => room.id === updatedRoom.id ? updatedRoom : room)
        );
      }
    });

    return unsubscribe;
  }, [currentRoom?.id]);

  const value: RoomContextType = {
    currentRoom,
    userRooms,
    loading,
    setCurrentRoom,
    createNewRoom,
    joinRoomById,
    refreshRooms
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};