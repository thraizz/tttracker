import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRoom } from '@/contexts/RoomContext';
import { useAuth } from '@/contexts/AuthContext';
import { updateRoom } from '@/services/roomService';
import { Player, Tournament, MMRMatch } from '@/types/tournament';
import { Download, Upload, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LegacyData {
  players?: Player[];
  currentTournament?: Tournament;
  mmrMatches?: MMRMatch[];
  view?: 'setup' | 'tournament';
  activeTab?: 'tournament' | 'mmr';
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { currentRoom, createNewRoom } = useRoom();
  const { toast } = useToast();
  
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [roomNameForImport, setRoomNameForImport] = useState('Imported Data Room');

  const exportCurrentRoomData = () => {
    if (!currentRoom) {
      toast({ title: 'Error', description: 'No room selected', variant: 'destructive' });
      return;
    }

    const exportData = {
      roomName: currentRoom.name,
      players: currentRoom.players,
      tournaments: currentRoom.tournaments,
      mmrMatches: currentRoom.mmrMatches,
      exportedAt: new Date().toISOString(),
      exportedBy: user?.uid || 'anonymous'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tttracker-${currentRoom.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: 'Success', description: 'Room data exported successfully!' });
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

  const importDataToRoom = async () => {
    if (!importData.trim()) {
      toast({ title: 'Error', description: 'Please paste the data to import', variant: 'destructive' });
      return;
    }

    if (!roomNameForImport.trim()) {
      toast({ title: 'Error', description: 'Please enter a room name', variant: 'destructive' });
      return;
    }

    setImporting(true);
    try {
      const parsedData = JSON.parse(importData);
      
      // Determine if this is legacy data or room export data
      const isLegacyData = parsedData.dataType === 'legacy' || !parsedData.roomName;
      
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
        // Handle room export data format
        players = parsedData.players || [];
        tournaments = parsedData.tournaments || [];
        mmrMatches = parsedData.mmrMatches || [];
      }

      // Create new room with imported data
      const roomId = await createNewRoom(roomNameForImport.trim(), 'Imported from backup data');
      
      // Update the room with imported data
      await updateRoom(roomId, {
        players,
        tournaments,
        mmrMatches
      });

      toast({ 
        title: 'Success', 
        description: `Data imported successfully into room "${roomNameForImport}"!` 
      });

      // Clear form
      setImportData('');
      setRoomNameForImport('Imported Data Room');
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
            Manage your data export and import settings
          </p>
        </div>

        {/* Export Current Room Data */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Current Room Data
            </CardTitle>
            <CardDescription>
              Download your current room's data as a backup file
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentRoom ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Current Room: {currentRoom.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentRoom.players.length} players • {currentRoom.tournaments.length} tournaments • {currentRoom.mmrMatches.length} MMR matches
                  </p>
                </div>
                <Button onClick={exportCurrentRoomData} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Room Data
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No room selected. Please select or create a room first.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Legacy Data */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Legacy Data
            </CardTitle>
            <CardDescription>
              Export data stored in your browser's local storage from older versions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Legacy Data Migration</p>
                  <p className="text-amber-700">
                    This will export any tournament and player data stored in your browser from previous versions of TTTracker.
                  </p>
                </div>
              </div>
              <Button onClick={exportLegacyData} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Legacy Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Import Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Import data from a backup file or legacy export into a new room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="room-name">New Room Name</Label>
              <Input
                id="room-name"
                value={roomNameForImport}
                onChange={(e) => setRoomNameForImport(e.target.value)}
                placeholder="Enter name for the new room"
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
                  1. Export your data from another device or backup<br/>
                  2. Copy the JSON content from the exported file<br/>
                  3. Paste it in the text area above<br/>
                  4. Enter a name for the new room<br/>
                  5. Click Import Data
                </p>
              </div>
            </div>

            <Button 
              onClick={importDataToRoom}
              disabled={importing || !importData.trim() || !roomNameForImport.trim()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};