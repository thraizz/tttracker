import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Group } from '../types/tournament';
import { useAuth } from './AuthContext';
import { getUserGroups, subscribeToGroup, createGroup, joinGroup, getPublicGroups } from '../services/groupService';

interface GroupContextType {
  currentGroup: Group | null;
  userGroups: Group[];
  publicGroups: Group[];
  loading: boolean;
  setCurrentGroup: (group: Group | null) => void;
  createNewGroup: (name: string, description?: string, settings?: { allowPublicJoin?: boolean; requireApproval?: boolean }) => Promise<string>;
  joinGroupById: (groupId: string, playerName?: string) => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshPublicGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};

interface GroupProviderProps {
  children: React.ReactNode;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshGroups = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const groups = await getUserGroups(user.uid);
      setUserGroups(groups);

      // If no current group and user has groups, set the first one as current
      setCurrentGroup(prevCurrentGroup => {
        if (!prevCurrentGroup && groups.length > 0) {
          return groups[0];
        }
        return prevCurrentGroup;
      });
    } catch (error) {
      console.error('Error fetching user groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]); // Removed currentGroup from dependencies

  const refreshPublicGroups = useCallback(async () => {
    if (!user) return;

    try {
      const groups = await getPublicGroups(user.uid);
      setPublicGroups(groups);
    } catch (error) {
      console.error('Error fetching public groups:', error);
    }
  }, [user]);

  const createNewGroup = useCallback(async (
    name: string,
    description?: string,
    settings?: { allowPublicJoin?: boolean; requireApproval?: boolean }
  ): Promise<string> => {
    if (!user) throw new Error('User must be authenticated');

    const groupData = {
      name,
      description: description || '',
      isPublic: settings?.allowPublicJoin || false,
      members: [],
      players: [],
      tournaments: [],
      mmrMatches: [],
      settings: {
        allowPublicJoin: settings?.allowPublicJoin || false,
        requireApproval: settings?.requireApproval || false
      }
    };

    const groupId = await createGroup(groupData, user.uid);
    await refreshGroups();
    await refreshPublicGroups();
    return groupId;
  }, [user, refreshGroups, refreshPublicGroups]);

  const joinGroupById = useCallback(async (groupId: string, playerName?: string): Promise<void> => {
    if (!user) throw new Error('User must be authenticated');

    await joinGroup(groupId, user.uid, playerName);
    await refreshGroups();
    await refreshPublicGroups();
  }, [user, refreshGroups, refreshPublicGroups]);

  // Initialize groups when user changes
  useEffect(() => {
    if (user) {
      refreshGroups();
      refreshPublicGroups();
    } else {
      // Clear state when user logs out
      setUserGroups([]);
      setPublicGroups([]);
      setCurrentGroup(null);
    }
  }, [user]); // Only depend on user, not the callback functions

  // Subscribe to current group updates
  useEffect(() => {
    if (!currentGroup) return;

    const unsubscribe = subscribeToGroup(currentGroup.id, (updatedGroup) => {
      if (updatedGroup) {
        setCurrentGroup(updatedGroup);
        // Update in userGroups as well
        setUserGroups(prev =>
          prev.map(group => group.id === updatedGroup.id ? updatedGroup : group)
        );
      }
    });

    return unsubscribe;
  }, [currentGroup?.id]); // Only depend on currentGroup.id, not the entire object

  const value: GroupContextType = useMemo(() => ({
    currentGroup,
    userGroups,
    publicGroups,
    loading,
    setCurrentGroup,
    createNewGroup,
    joinGroupById,
    refreshGroups,
    refreshPublicGroups
  }), [currentGroup, userGroups, publicGroups, loading, createNewGroup, joinGroupById, refreshGroups, refreshPublicGroups]);

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};