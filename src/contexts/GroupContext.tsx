import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Group } from '../types/tournament';
import { useAuth } from './AuthContext';
import { getUserGroups, subscribeToGroup, createGroup, joinGroup } from '../services/groupService';

interface GroupContextType {
  currentGroup: Group | null;
  userGroups: Group[];
  loading: boolean;
  setCurrentGroup: (group: Group | null) => void;
  createNewGroup: (name: string, description?: string) => Promise<string>;
  joinGroupById: (groupId: string) => Promise<void>;
  refreshGroups: () => Promise<void>;
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
  const [loading, setLoading] = useState(false);

  const refreshGroups = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const groups = await getUserGroups(user.uid);
      setUserGroups(groups);

      // If no current group and user has groups, set the first one as current
      if (!currentGroup && groups.length > 0) {
        setCurrentGroup(groups[0]);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentGroup]);

  const createNewGroup = async (name: string, description?: string): Promise<string> => {
    if (!user) throw new Error('User must be authenticated');

    const groupData = {
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

    const groupId = await createGroup(groupData, user.uid);
    await refreshGroups();
    return groupId;
  };

  const joinGroupById = async (groupId: string): Promise<void> => {
    if (!user) throw new Error('User must be authenticated');

    await joinGroup(groupId, user.uid);
    await refreshGroups();
  };

  useEffect(() => {
    if (user) {
      refreshGroups();
    }
  }, [user, refreshGroups]);

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
  }, [currentGroup?.id]);

  const value: GroupContextType = {
    currentGroup,
    userGroups,
    loading,
    setCurrentGroup,
    createNewGroup,
    joinGroupById,
    refreshGroups
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};