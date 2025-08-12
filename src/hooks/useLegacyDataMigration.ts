import { useState, useEffect } from 'react';
import { Player, Tournament, MMRMatch } from '@/types/tournament';

interface LegacyData {
  players?: Player[];
  currentTournament?: Tournament;
  mmrMatches?: MMRMatch[];
  view?: 'setup' | 'tournament';
  activeTab?: 'tournament' | 'mmr';
}

export const useLegacyDataMigration = () => {
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [legacyData, setLegacyData] = useState<LegacyData | null>(null);
  const [migrationChecked, setMigrationChecked] = useState(false);

  useEffect(() => {
    checkForLegacyData();
  }, []);

  const checkForLegacyData = () => {
    try {
      const players = localStorage.getItem('players');
      const currentTournament = localStorage.getItem('currentTournament');
      const mmrMatches = localStorage.getItem('mmrMatches');
      const view = localStorage.getItem('view');
      const activeTab = localStorage.getItem('activeTab');

      const data: LegacyData = {};
      let hasData = false;

      if (players) {
        data.players = JSON.parse(players);
        hasData = true;
      }
      
      if (currentTournament) {
        data.currentTournament = JSON.parse(currentTournament);
        hasData = true;
      }
      
      if (mmrMatches) {
        data.mmrMatches = JSON.parse(mmrMatches);
        hasData = true;
      }
      
      if (view) {
        data.view = JSON.parse(view);
      }
      
      if (activeTab) {
        data.activeTab = JSON.parse(activeTab);
      }

      if (hasData) {
        setHasLegacyData(true);
        setLegacyData(data);
      }
    } catch (error) {
      console.error('Error checking for legacy data:', error);
    } finally {
      setMigrationChecked(true);
    }
  };

  const clearLegacyData = () => {
    localStorage.removeItem('players');
    localStorage.removeItem('currentTournament');
    localStorage.removeItem('mmrMatches');
    localStorage.removeItem('view');
    localStorage.removeItem('activeTab');
    setHasLegacyData(false);
    setLegacyData(null);
  };

  const markMigrationDismissed = () => {
    localStorage.setItem('migrationDismissed', 'true');
    setHasLegacyData(false);
  };

  const wasMigrationDismissed = () => {
    return localStorage.getItem('migrationDismissed') === 'true';
  };

  return {
    hasLegacyData: hasLegacyData && !wasMigrationDismissed(),
    legacyData,
    migrationChecked,
    clearLegacyData,
    markMigrationDismissed
  };
};