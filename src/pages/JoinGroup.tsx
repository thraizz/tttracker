import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { getGroupInvite, consumeGroupInvite, getGroup } from '@/services/groupService';
import { GroupInvite, Group } from '@/types/tournament';
import { Users, Calendar, Clock } from 'lucide-react';

export const JoinGroup: React.FC = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { joinGroupById, setCurrentGroup } = useGroup();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInviteData = async () => {
      if (!inviteId) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        const inviteData = await getGroupInvite(inviteId);
        if (!inviteData) {
          setError('Invite not found or has expired');
          setLoading(false);
          return;
        }

        // Check if invite is expired
        if (inviteData.expiresAt && inviteData.expiresAt < new Date()) {
          setError('This invite has expired');
          setLoading(false);
          return;
        }

        // Check usage limit
        if (inviteData.usageLimit && inviteData.usedCount >= inviteData.usageLimit) {
          setError('This invite has reached its usage limit');
          setLoading(false);
          return;
        }

        setInvite(inviteData);

        // Load group data
        const groupData = await getGroup(inviteData.groupId);
        if (!groupData) {
          setError('Group not found');
          setLoading(false);
          return;
        }

        setGroup(groupData);
      } catch (error) {
        console.error('Error loading invite:', error);
        setError('Failed to load invite');
      } finally {
        setLoading(false);
      }
    };

    loadInviteData();
  }, [inviteId]);

  const handleJoinGroup = async () => {
    if (!invite || !group || !user) return;

    setJoining(true);
    try {
      // Check if user is already a member
      if (group.members.includes(user.uid)) {
        setCurrentGroup(group);
        toast({ title: 'Success', description: 'You are already a member of this group!' });
        navigate('/');
        return;
      }

      // Use the invite (increment usage count)
      await consumeGroupInvite(invite.id);
      
      // Join the group
      await joinGroupById(group.id);
      
      // Set as current group
      setCurrentGroup(group);
      
      toast({ title: 'Success', description: `Successfully joined ${group.name}!` });
      navigate('/');
    } catch (error: unknown) {
      console.error('Error joining group:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to join group',
        variant: 'destructive'
      });
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invite Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Main App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group || !invite) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invite Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>This invite link is invalid or has expired.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Main App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Join Group</CardTitle>
          <CardDescription>You've been invited to join a table tennis group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{group.name}</h3>
            {group.description && (
              <p className="text-muted-foreground text-sm">{group.description}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{group.members.length} members</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Created {group.createdAt.toLocaleDateString()}</span>
            </div>

            {invite.expiresAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Expires {invite.expiresAt.toLocaleDateString()}</span>
              </div>
            )}

            {invite.usageLimit && (
              <div className="text-sm text-muted-foreground">
                Used {invite.usedCount} / {invite.usageLimit} times
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleJoinGroup}
              disabled={joining}
              className="w-full"
            >
              {joining ? 'Joining...' : 'Join Group'}
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};