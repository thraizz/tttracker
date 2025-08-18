import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useGroup } from '@/contexts/GroupContext';
import { useAuth } from '@/contexts/AuthContext';
import { updateGroup } from '@/services/groupService';
import { Player, Tournament, MMRMatch } from '@/types/tournament';
import { Download, Upload, FileText, AlertTriangle, ArrowLeft, User, LogIn, LogOut, Chrome, Info, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleUpgradeModal } from '@/components/GoogleUpgradeModal';

interface LegacyData {
  players?: Player[];
  currentTournament?: Tournament;
  mmrMatches?: MMRMatch[];
  view?: 'setup' | 'tournament';
  activeTab?: 'tournament' | 'mmr';
}

export const Settings: React.FC = () => {
  const { user, isAnonymous, signInWithGoogle, signOut } = useAuth();
  const { currentGroup, createNewGroup } = useGroup();
  const { toast } = useToast();

  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [groupNameForImport, setGroupNameForImport] = useState('Imported Data Group');
  const [signingIn, setSigningIn] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleGoogleSignIn = async () => {
    if (isAnonymous) {
      // Show upgrade modal for anonymous users
      setShowUpgradeModal(true);
    } else {
      // Direct Google sign-in for new users
      setSigningIn(true);
      try {
        await signInWithGoogle();
        toast({
          title: 'Success',
          description: 'Successfully signed in with Google!'
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to sign in with Google. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setSigningIn(false);
      }
    }
  };

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false);
    toast({
      title: 'Success',
      description: 'Successfully upgraded to Google account! Your data is now synced across devices.'
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Success',
        description: 'Successfully signed out!'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const exportCurrentGroupData = () => {
    if (!currentGroup) {
      toast({ title: 'Error', description: 'No group selected', variant: 'destructive' });
      return;
    }

    const exportData = {
      groupName: currentGroup.name,
      players: currentGroup.players,
      tournaments: currentGroup.tournaments,
      mmrMatches: currentGroup.mmrMatches,
      exportedAt: new Date().toISOString(),
      exportedBy: user?.uid || 'anonymous'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `tttracker-${currentGroup.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: 'Success', description: 'Group data exported successfully!' });
  };

  const exportLegacyData = () => {
    const legacyData: LegacyData = {};

    // Try to get data from localStorage
    try {
      const players = localStorage.getItem('players');
      const currentTournament = localStorage.getItem('currentTournament');
      const mmrMatches = localStorage.getItem('mmrMatches');
      const view = localStorage.getItem('view');
      const activeTab = localStorage.getItem('activeTab');

      if (players) legacyData.players = JSON.parse(players);
      if (currentTournament) legacyData.currentTournament = JSON.parse(currentTournament);
      if (mmrMatches) legacyData.mmrMatches = JSON.parse(mmrMatches);
      if (view) legacyData.view = JSON.parse(view);
      if (activeTab) legacyData.activeTab = JSON.parse(activeTab);

      if (Object.keys(legacyData).length === 0) {
        toast({ title: 'Info', description: 'No legacy data found in localStorage', variant: 'default' });
        return;
      }

      const exportData = {
        ...legacyData,
        exportedAt: new Date().toISOString(),
        dataType: 'legacy'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `tttracker-legacy-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: 'Success', description: 'Legacy data exported successfully!' });
    } catch (error) {
      console.error('Error exporting legacy data:', error);
      toast({ title: 'Error', description: 'Failed to export legacy data', variant: 'destructive' });
    }
  };

  const importDataToGroup = async () => {
    if (!importData.trim()) {
      toast({ title: 'Error', description: 'Please paste the data to import', variant: 'destructive' });
      return;
    }

    if (!groupNameForImport.trim()) {
      toast({ title: 'Error', description: 'Please enter a group name', variant: 'destructive' });
      return;
    }

    setImporting(true);
    try {
      const parsedData = JSON.parse(importData);

      // Determine if this is legacy data or group export data
      const isLegacyData = parsedData.dataType === 'legacy' || !parsedData.groupName;

      let players: Player[] = [];
      let tournaments: Tournament[] = [];
      let mmrMatches: MMRMatch[] = [];

      if (isLegacyData) {
        // Handle legacy data format
        if (parsedData.players) {
          players = parsedData.players.map((player: Player) => ({
            ...player,
            mmr: player.mmr || 1000,
            peakMmr: player.peakMmr || player.mmr || 1000
          }));
        }

        if (parsedData.currentTournament) {
          tournaments = [parsedData.currentTournament];
        }

        if (parsedData.mmrMatches) {
          mmrMatches = parsedData.mmrMatches;
        }
      } else {
        // Handle group export data format
        players = parsedData.players || [];
        tournaments = parsedData.tournaments || [];
        mmrMatches = parsedData.mmrMatches || [];
      }

      // Create new group with imported data
      const groupId = await createNewGroup(groupNameForImport.trim(), 'Imported from backup data');

      // Update the group with imported data
      await updateGroup(groupId, {
        players,
        tournaments,
        mmrMatches
      });

      toast({
        title: 'Success',
        description: `Data imported successfully into group "${groupNameForImport}"!`
      });

      // Clear form
      setImportData('');
      setGroupNameForImport('Imported Data Group');
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to import data. Please check the data format.',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-gray to-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to App
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, data export and import settings
          </p>
        </div>

        {/* Account & Authentication */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account & Data Persistence
            </CardTitle>
            <CardDescription>
              Sign in with Google to sync your data across devices and keep it safe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && !isAnonymous ? (
              // Signed in with Google
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-green-300"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-900">
                      Signed in as {user.displayName || user.email}
                    </p>
                    <p className="text-sm text-green-700">
                      Your data is automatically saved and synced across devices
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              // Anonymous or not signed in
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 mb-1">
                      Using Anonymous Mode
                    </p>
                    <p className="text-sm text-amber-700">
                      Your data is only stored locally and may be lost if you clear your browser data or switch devices.
                      Sign in with Google to sync your data across devices and keep it safe.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isAnonymous ? (
                    <>
                      <Cloud className="h-4 w-4" />
                      Change to Google Account
                    </>
                  ) : (
                    <>
                      <Chrome className="h-4 w-4" />
                      {signingIn ? 'Signing in...' : 'Sign in with Google'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Version Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Version Information
            </CardTitle>
            <CardDescription>
              Current build and version details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Version</p>
                  <p className="font-mono">1.0.0</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Build Environment</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {import.meta.env.MODE}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Git Commit</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                    {__GIT_HASH__.substring(0, 12)}...
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Build Timestamp</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {new Date(__BUILD_TIMESTAMP__).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Export Current Group Data */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Current Group Data
            </CardTitle>
            <CardDescription>
              Download your current group's data as a backup file
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentGroup ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Current Group: {currentGroup.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentGroup.players.length} players • {currentGroup.tournaments.length} tournaments • {currentGroup.mmrMatches.length} MMR matches
                  </p>
                </div>
                <Button onClick={exportCurrentGroupData} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Group Data
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No group selected. Please select or create a group first.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Import data from a backup file or legacy export into a new group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="group-name">New Group Name</Label>
              <Input
                id="group-name"
                value={groupNameForImport}
                onChange={(e) => setGroupNameForImport(e.target.value)}
                placeholder="Enter name for the new group"
              />
            </div>

            <div>
              <Label htmlFor="import-data">Paste Export Data</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste the JSON export data here..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">How to Import</p>
                <p className="text-blue-700">
                  1. Export your data from another device or backup<br />
                  2. Copy the JSON content from the exported file<br />
                  3. Paste it in the text area above<br />
                  4. Enter a name for the new group<br />
                  5. Click Import Data
                </p>
              </div>
            </div>

            <Button
              onClick={importDataToGroup}
              disabled={importing || !importData.trim() || !groupNameForImport.trim()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Google Upgrade Modal */}
        <GoogleUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={handleUpgradeSuccess}
        />
      </div>
    </div>
  );
};